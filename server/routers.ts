import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { calculateTotalScore, calculateBreakEven, getDefaultWeights, getRecommendationText, INDUSTRY_AVG_TURNOVER } from "./scoring";
import { invokeLLM } from "./_core/llm";
import { generateEvaluationPDF } from "./pdfGenerator";
import { notifyOwner } from "./_core/notification";
import { analyzeDataCenter, getCompetitionLevel } from "./dataCenter";

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // 餐厅管理
  restaurant: router({
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        type: z.string(),
        subCategory: z.string().optional(),
        priceRangeMin: z.number().min(0),
        priceRangeMax: z.number().min(0),
        targetCustomer: z.string(),
        scale: z.string(),
        businessModel: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await db.createRestaurant({
          ...input,
          subCategory: input.subCategory || null,
          userId: ctx.user.id,
        });
        return { id };
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getRestaurantsByUser(ctx.user.id);
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        return db.getRestaurantById(input.id, ctx.user.id);
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        type: z.string().optional(),
        priceRangeMin: z.number().min(0).optional(),
        priceRangeMax: z.number().min(0).optional(),
        targetCustomer: z.string().optional(),
        scale: z.string().optional(),
        businessModel: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await db.updateRestaurant(id, ctx.user.id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteRestaurant(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // 选址评估
  evaluation: router({
    create: protectedProcedure
      .input(z.object({
        restaurantId: z.number(),
        address: z.string().min(1),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
        area: z.number().min(1),
        monthlyRent: z.number().min(0),
        // 周边餐厅市调
        hasSameCategory: z.boolean().optional(),
        // 品牌A市调数据
        brandAName: z.string().optional(),
        brandAMonLunch: z.number().min(0).max(100).optional(),
        brandAMonDinner: z.number().min(0).max(100).optional(),
        brandAFriLunch: z.number().min(0).max(100).optional(),
        brandAFriDinner: z.number().min(0).max(100).optional(),
        brandASatLunch: z.number().min(0).max(100).optional(),
        brandASatDinner: z.number().min(0).max(100).optional(),
        // 品牌B市调数据
        brandBName: z.string().optional(),
        brandBMonLunch: z.number().min(0).max(100).optional(),
        brandBMonDinner: z.number().min(0).max(100).optional(),
        brandBFriLunch: z.number().min(0).max(100).optional(),
        brandBFriDinner: z.number().min(0).max(100).optional(),
        brandBSatLunch: z.number().min(0).max(100).optional(),
        brandBSatDinner: z.number().min(0).max(100).optional(),
        // 品牌C市调数据
        brandCName: z.string().optional(),
        brandCMonLunch: z.number().min(0).max(100).optional(),
        brandCMonDinner: z.number().min(0).max(100).optional(),
        brandCFriLunch: z.number().min(0).max(100).optional(),
        brandCFriDinner: z.number().min(0).max(100).optional(),
        brandCSatLunch: z.number().min(0).max(100).optional(),
        brandCSatDinner: z.number().min(0).max(100).optional(),
        isMainCorridor: z.boolean().optional(),
        storefrontWidth: z.number().optional(),
        hasStairs: z.boolean().optional(),
        hasDeepAlley: z.boolean().optional(),
        surroundingDesc: z.string().optional(),
        population1km: z.number().optional(),
        population3km: z.number().optional(),
        officeBuildings: z.number().optional(),
        estimatedWorkstations: z.number().optional(),
        parkingSpots: z.number().optional(),
        ageGroup: z.string().optional(),
        consumptionLevel: z.string().optional(),
        // 评分
        trafficScore: z.number().min(1).max(10),
        locationScore: z.number().min(1).max(10),
        customerMatchScore: z.number().min(1).max(10),
        heatScore: z.number().min(1).max(10),
        costScore: z.number().min(1).max(10),
        competitionScore: z.number().min(1).max(10),
        // 竞对分析（手动输入）
        manualCompetitors: z.array(z.object({
          name: z.string(),
          category: z.string(),
          distance: z.string(),
          priceRange: z.string(),
        })).optional(),
        sameCategoryCount: z.number().optional(),
        competitionSaturationIndex: z.number().optional(),
        isRedOcean: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // 获取餐厅信息以确定权重模型
        const restaurant = await db.getRestaurantById(input.restaurantId, ctx.user.id);
        if (!restaurant) {
          throw new Error("餐厅不存在");
        }

        // 计算综合得分
        const weights = getDefaultWeights(restaurant.businessModel);
        const result = calculateTotalScore({
          trafficScore: input.trafficScore,
          locationScore: input.locationScore,
          customerMatchScore: input.customerMatchScore,
          heatScore: input.heatScore,
          costScore: input.costScore,
          competitionScore: input.competitionScore,
        }, weights);

        // 构建数据库插入对象，排除非数据库字段
        const { manualCompetitors, ...restInput } = input;
        
        const id = await db.createSiteEvaluation({
          ...restInput,
          userId: ctx.user.id,
          latitude: input.latitude?.toString(),
          longitude: input.longitude?.toString(),
          storefrontWidth: input.storefrontWidth?.toString(),
          hasSameCategory: input.hasSameCategory ? 1 : 0,
          isMainCorridor: input.isMainCorridor ? 1 : 0,
          hasStairs: input.hasStairs ? 1 : 0,
          hasDeepAlley: input.hasDeepAlley ? 1 : 0,
          isRedOcean: input.isRedOcean ? 1 : 0,
          // 竞对数据存储为JSON字符串
          manualCompetitors: manualCompetitors ? JSON.stringify(manualCompetitors) : null,
          totalScore: result.totalScore.toString(),
          recommendation: result.recommendation,
        });

        // 如果是高分评估，发送通知
        if (result.totalScore >= 80) {
          await notifyOwner({
            title: `新的高分选址评估: ${restaurant.name}`,
            content: `地址: ${input.address}\n综合得分: ${result.totalScore}分\n建议: ${result.recommendation === 'recommended' ? '推荐' : '谨慎'}`,
          });
        }

        return { id, ...result };
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getSiteEvaluationsByUser(ctx.user.id);
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const evaluation = await db.getSiteEvaluationById(input.id, ctx.user.id);
        if (!evaluation) return null;
        
        const restaurant = await db.getRestaurantById(evaluation.restaurantId, ctx.user.id);
        return { evaluation, restaurant };
      }),

    getByRestaurant: protectedProcedure
      .input(z.object({ restaurantId: z.number() }))
      .query(async ({ ctx, input }) => {
        return db.getSiteEvaluationsByRestaurant(input.restaurantId, ctx.user.id);
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        trafficScore: z.number().min(1).max(10).optional(),
        locationScore: z.number().min(1).max(10).optional(),
        customerMatchScore: z.number().min(1).max(10).optional(),
        heatScore: z.number().min(1).max(10).optional(),
        costScore: z.number().min(1).max(10).optional(),
        competitionScore: z.number().min(1).max(10).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...scores } = input;
        const evaluation = await db.getSiteEvaluationById(id, ctx.user.id);
        if (!evaluation) throw new Error("评估不存在");

        const restaurant = await db.getRestaurantById(evaluation.restaurantId, ctx.user.id);
        if (!restaurant) throw new Error("餐厅不存在");

        // 重新计算得分
        const weights = getDefaultWeights(restaurant.businessModel);
        const newScores = {
          trafficScore: scores.trafficScore ?? evaluation.trafficScore ?? 5,
          locationScore: scores.locationScore ?? evaluation.locationScore ?? 5,
          customerMatchScore: scores.customerMatchScore ?? evaluation.customerMatchScore ?? 5,
          heatScore: scores.heatScore ?? evaluation.heatScore ?? 5,
          costScore: scores.costScore ?? evaluation.costScore ?? 5,
          competitionScore: scores.competitionScore ?? evaluation.competitionScore ?? 5,
        };
        const result = calculateTotalScore(newScores, weights);

        await db.updateSiteEvaluation(id, ctx.user.id, {
          ...scores,
          totalScore: result.totalScore.toString(),
          recommendation: result.recommendation,
        });

        return { success: true, ...result };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteSiteEvaluation(input.id, ctx.user.id);
        return { success: true };
      }),

    // 重新计算得分
    recalculate: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const evaluation = await db.getSiteEvaluationById(input.id, ctx.user.id);
        if (!evaluation) throw new Error("评估不存在");

        const restaurant = await db.getRestaurantById(evaluation.restaurantId, ctx.user.id);
        if (!restaurant) throw new Error("餐厅不存在");

        const weights = getDefaultWeights(restaurant.businessModel);
        const result = calculateTotalScore({
          trafficScore: evaluation.trafficScore ?? 5,
          locationScore: evaluation.locationScore ?? 5,
          customerMatchScore: evaluation.customerMatchScore ?? 5,
          heatScore: evaluation.heatScore ?? 5,
          costScore: evaluation.costScore ?? 5,
          competitionScore: evaluation.competitionScore ?? 5,
        }, weights);

        await db.updateSiteEvaluation(input.id, ctx.user.id, {
          totalScore: result.totalScore.toString(),
          recommendation: result.recommendation,
        });

        return result;
      }),
  }),

  // 财务测算
  financial: router({
    calculate: protectedProcedure
      .input(z.object({
        evaluationId: z.number(),
        estimatedPrice: z.number().min(1),
        grossMarginRate: z.number().min(1).max(100),
        monthlyRent: z.number().min(0),
        monthlyLabor: z.number().min(0),
        otherCosts: z.number().min(0).default(0),
        seats: z.number().min(1),
        restaurantType: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const result = calculateBreakEven({
          estimatedPrice: input.estimatedPrice,
          grossMarginRate: input.grossMarginRate,
          monthlyRent: input.monthlyRent,
          monthlyLabor: input.monthlyLabor,
          otherCosts: input.otherCosts,
          seats: input.seats,
          restaurantType: input.restaurantType,
        });

        await db.createFinancialCalculation({
          evaluationId: input.evaluationId,
          estimatedPrice: input.estimatedPrice,
          grossMarginRate: input.grossMarginRate.toString(),
          monthlyRent: input.monthlyRent,
          monthlyLabor: input.monthlyLabor,
          otherCosts: input.otherCosts,
          seats: input.seats,
          dailyBreakEven: result.dailyBreakEven.toString(),
          dailyTurnover: result.dailyTurnover.toString(),
          industryAvgTurnover: result.industryAvgTurnover.toString(),
          riskLevel: result.riskLevel,
        });

        return result;
      }),

    getByEvaluation: protectedProcedure
      .input(z.object({ evaluationId: z.number() }))
      .query(async ({ input }) => {
        return db.getFinancialCalculationByEvaluation(input.evaluationId);
      }),

    // 快速计算（不保存）
    quickCalculate: publicProcedure
      .input(z.object({
        estimatedPrice: z.number().min(1),
        grossMarginRate: z.number().min(1).max(100),
        monthlyRent: z.number().min(0),
        monthlyLabor: z.number().min(0),
        otherCosts: z.number().min(0).default(0),
        seats: z.number().min(1),
        restaurantType: z.string(),
      }))
      .mutation(({ input }) => {
        return calculateBreakEven(input);
      }),
  }),

  // LLM分析
  analysis: router({
    generate: protectedProcedure
      .input(z.object({ evaluationId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const evaluation = await db.getSiteEvaluationById(input.evaluationId, ctx.user.id);
        if (!evaluation) throw new Error("评估不存在");

        const restaurant = await db.getRestaurantById(evaluation.restaurantId, ctx.user.id);
        if (!restaurant) throw new Error("餐厅不存在");

        const financial = await db.getFinancialCalculationByEvaluation(input.evaluationId);
        const recommendationText = getRecommendationText(
          Number(evaluation.totalScore) || 0,
          evaluation.recommendation || 'cautious'
        );

        const prompt = `你是一位专业的餐饮选址顾问，请根据以下数据生成一份专业的选址分析报告。

## 餐厅信息
- 餐厅名称：${restaurant.name}
- 餐厅类型：${restaurant.type}
- 客单价范围：${restaurant.priceRangeMin}-${restaurant.priceRangeMax}元
- 目标客群：${restaurant.targetCustomer}
- 餐厅规模：${restaurant.scale}
- 经营模式：${restaurant.businessModel}

## 选址信息
- 地址：${evaluation.address}
- 铺位面积：${evaluation.area}㎡
- 月租金：${evaluation.monthlyRent}元
- 是否主通道：${evaluation.isMainCorridor ? '是' : '否'}
- 门头宽度：${evaluation.storefrontWidth || '未知'}米
- 需要上台阶：${evaluation.hasStairs ? '是' : '否'}
- 进深巷：${evaluation.hasDeepAlley ? '是' : '否'}
- 周边1km人口：${evaluation.population1km || '未知'}
- 周边3km人口：${evaluation.population3km || '未知'}
- 周边写字楼：${evaluation.officeBuildings || '未知'}栋
- 停车位：${evaluation.parkingSpots || '未知'}个
- 周边环境：${evaluation.surroundingDesc || '未提供'}

## 评分情况（1-10分）
- 客流量评分：${evaluation.trafficScore}
- 铺位条件评分：${evaluation.locationScore}
- 客群匹配度评分：${evaluation.customerMatchScore}
- 区域热力评分：${evaluation.heatScore}
- 成本评分：${evaluation.costScore}
- 竞争环境评分：${evaluation.competitionScore}
- 综合得分：${evaluation.totalScore}分
- 系统建议：${recommendationText.title}

${financial ? `## 财务测算
- 日保本营业额：${financial.dailyBreakEven}元
- 日保本翻台率：${financial.dailyTurnover}次
- 行业平均翻台率：${financial.industryAvgTurnover}次
- 风险等级：${financial.riskLevel}` : ''}

请生成一份包含以下内容的分析报告：
1. **综合评价**：对该选址的整体评价（2-3句话）
2. **优势分析**：列出3-5个主要优势
3. **劣势分析**：列出3-5个主要劣势或风险点
4. **风险提示**：需要特别注意的风险因素
5. **改进建议**：针对劣势的具体改进建议
6. **最终建议**：是否推荐选择该位置，以及理由

请用专业但易懂的语言撰写，适合餐饮经营者阅读。`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: "你是一位经验丰富的餐饮选址顾问，擅长分析选址数据并给出专业建议。请用中文回复。" },
            { role: "user", content: prompt },
          ],
        });

        const rawContent = response.choices[0]?.message?.content;
        const analysis = typeof rawContent === 'string' ? rawContent : (rawContent?.[0] && 'text' in rawContent[0] ? rawContent[0].text : "分析生成失败");

        // 保存分析结果
        await db.updateSiteEvaluation(input.evaluationId, ctx.user.id, {
          llmAnalysis: analysis,
        });

        return { analysis };
      }),
  }),

  // 周边环境智能分析
  surroundings: router({
    analyze: protectedProcedure
      .input(z.object({
        address: z.string(),
        latitude: z.number(),
        longitude: z.number(),
        officeCount: z.number().optional(),
        mallCount: z.number().optional(),
        restaurantCount: z.number().optional(),
        transitCount: z.number().optional(),
        surroundingDesc: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const prompt = `你是一位专业的商业地产分析师，请根据以下位置信息，智能估算周边环境数据。

## 位置信息
- 地址：${input.address}
- 坐标：${input.latitude}, ${input.longitude}
- 周边写字楼数量：${input.officeCount || '未知'}
- 周边商场数量：${input.mallCount || '未知'}
- 周边餐厅数量：${input.restaurantCount || '未知'}
- 周边地铁站数量：${input.transitCount || '未知'}
- 已知周边环境：${input.surroundingDesc || '未知'}

请根据地址和已知信息，估算以下数据（请给出合理的估算值）：

请以JSON格式返回，包含以下字段：
{
  "population1km": 数字, // 1km常住人口估算
  "population3km": 数字, // 3km常住人口估算
  "parkingSpots": 数字, // 周边停车位估算
  "ageGroup": "字符串", // 主要年龄层，可选值: "18-24", "25-35", "35-45", "45-55", "55+"
  "consumptionLevel": "字符串", // 消费能力，可选值: "low", "medium", "high", "premium"
  "reasoning": "字符串" // 简要说明估算依据
}

注意：
1. 如果是商业区/写字楼密集区，人口密度较高，年龄层偏年轻，消费能力较强
2. 如果是住宅区，人口密度适中，年龄层分布均匀
3. 如果是学校附近，年龄层偏年轻，消费能力偏低
4. 根据写字楼数量估算停车位（每栋写字楼约200-500个停车位）
5. 根据商场数量估算停车位（每个商场约500-2000个停车位）`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: "你是一位专业的商业地产分析师，擅长分析商业地段的人口、消费特征。请只返回JSON格式，不要包含其他内容。" },
            { role: "user", content: prompt },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "surroundings_analysis",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  population1km: { type: "number", description: "1km常住人口估算" },
                  population3km: { type: "number", description: "3km常住人口估算" },
                  parkingSpots: { type: "number", description: "周边停车位估算" },
                  ageGroup: { type: "string", description: "主要年龄层" },
                  consumptionLevel: { type: "string", description: "消费能力" },
                  reasoning: { type: "string", description: "估算依据说明" },
                },
                required: ["population1km", "population3km", "parkingSpots", "ageGroup", "consumptionLevel", "reasoning"],
                additionalProperties: false,
              },
            },
          },
        });

        const rawContent = response.choices[0]?.message?.content;
        const contentStr = typeof rawContent === 'string' ? rawContent : (rawContent?.[0] && 'text' in rawContent[0] ? rawContent[0].text : "{}");
        
        try {
          const result = JSON.parse(contentStr);
          return {
            population1km: result.population1km || 30000,
            population3km: result.population3km || 150000,
            parkingSpots: result.parkingSpots || 500,
            ageGroup: result.ageGroup || "25-35",
            consumptionLevel: result.consumptionLevel || "medium",
            reasoning: result.reasoning || "基于地址位置的智能估算",
          };
        } catch {
          // 默认值
          return {
            population1km: 30000,
            population3km: 150000,
            parkingSpots: 500,
            ageGroup: "25-35",
            consumptionLevel: "medium",
            reasoning: "基于地址位置的默认估算",
          };
        }
      }),
  }),

  // 数据中心分析
  dataCenter: router({
    analyze: protectedProcedure
      .input(z.object({
        address: z.string(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
        restaurantType: z.string(),
        subCategory: z.string().optional(),
        mallName: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const result = await analyzeDataCenter(input);
        const competitionLevel = getCompetitionLevel(result.sameCategoryCount);
        return {
          ...result,
          competitionLevel,
        };
      }),
  }),

  // PDF导出
  pdf: router({
    exportEvaluation: protectedProcedure
      .input(z.object({ evaluationId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const evaluation = await db.getSiteEvaluationById(input.evaluationId, ctx.user.id);
        if (!evaluation) throw new Error("评估不存在");

        const restaurant = await db.getRestaurantById(evaluation.restaurantId, ctx.user.id);
        if (!restaurant) throw new Error("餐厅不存在");

        const pdfBuffer = await generateEvaluationPDF({ evaluation, restaurant });
        
        // 返回base64编码的PDF
        return {
          data: pdfBuffer.toString('base64'),
          filename: `选址评估报告_${evaluation.address.slice(0, 20)}_${new Date().toISOString().slice(0, 10)}.pdf`,
        };
      }),
  }),

  // 评分配置
  config: router({
    getWeights: publicProcedure
      .input(z.object({ businessModel: z.string() }))
      .query(({ input }) => {
        return getDefaultWeights(input.businessModel);
      }),

    getIndustryTurnover: publicProcedure.query(() => {
      return INDUSTRY_AVG_TURNOVER;
    }),
  }),
});

export type AppRouter = typeof appRouter;
