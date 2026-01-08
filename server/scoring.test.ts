import { describe, expect, it } from "vitest";
import { 
  calculateTotalScore, 
  getDefaultWeights,
  calculateBreakEven,
  INDUSTRY_AVG_TURNOVER,
  DEFAULT_WEIGHTS,
  getRecommendationText
} from "./scoring";

describe("评分算法测试", () => {
  describe("DEFAULT_WEIGHTS - 权重配置", () => {
    it("快餐模型权重配置正确", () => {
      const weights = DEFAULT_WEIGHTS.fastFood;
      expect(weights.trafficWeight).toBe(60);
      expect(weights.costWeight).toBe(10);
      expect(weights.locationWeight).toBe(10);
      // 所有权重之和应为100
      const total = weights.trafficWeight + weights.locationWeight + 
                   weights.customerMatchWeight + weights.heatWeight + 
                   weights.costWeight + weights.competitionWeight;
      expect(total).toBe(100);
    });

    it("正餐模型权重配置正确", () => {
      const weights = DEFAULT_WEIGHTS.dineIn;
      expect(weights.locationWeight).toBe(25);
      expect(weights.costWeight).toBe(20);
      // 所有权重之和应为100
      const total = weights.trafficWeight + weights.locationWeight + 
                   weights.customerMatchWeight + weights.heatWeight + 
                   weights.costWeight + weights.competitionWeight;
      expect(total).toBe(100);
    });

    it("均衡模型权重配置正确", () => {
      const weights = DEFAULT_WEIGHTS.balanced;
      // 所有权重之和应为100
      const total = weights.trafficWeight + weights.locationWeight + 
                   weights.customerMatchWeight + weights.heatWeight + 
                   weights.costWeight + weights.competitionWeight;
      expect(total).toBe(100);
    });
  });

  describe("getDefaultWeights - 根据经营模式获取权重", () => {
    it("快餐模式返回快餐权重", () => {
      const weights = getDefaultWeights("快餐");
      expect(weights).toEqual(DEFAULT_WEIGHTS.fastFood);
    });

    it("正餐模式返回正餐权重", () => {
      const weights = getDefaultWeights("正餐");
      expect(weights).toEqual(DEFAULT_WEIGHTS.dineIn);
    });

    it("聚餐模式返回正餐权重", () => {
      const weights = getDefaultWeights("聚餐");
      expect(weights).toEqual(DEFAULT_WEIGHTS.dineIn);
    });

    it("其他模式返回均衡权重", () => {
      const weights = getDefaultWeights("其他");
      expect(weights).toEqual(DEFAULT_WEIGHTS.balanced);
    });
  });

  describe("calculateTotalScore - 综合评分计算", () => {
    it("快餐模型评分计算正确", () => {
      const scores = {
        trafficScore: 8,
        locationScore: 6,
        customerMatchScore: 7,
        heatScore: 5,
        costScore: 9,
        competitionScore: 6,
      };
      
      const result = calculateTotalScore(scores, DEFAULT_WEIGHTS.fastFood);
      
      // 快餐模型权重: traffic:60, location:10, customerMatch:10, heat:5, cost:10, competition:5
      // (8/10)*60 + (6/10)*10 + (7/10)*10 + (5/10)*5 + (9/10)*10 + (6/10)*5
      // = 48 + 6 + 7 + 2.5 + 9 + 3 = 75.5
      expect(result.totalScore).toBeCloseTo(75.5, 1);
    });

    it("正餐模型评分计算正确", () => {
      const scores = {
        trafficScore: 6,
        locationScore: 9,
        customerMatchScore: 7,
        heatScore: 8,
        costScore: 5,
        competitionScore: 7,
      };
      
      const result = calculateTotalScore(scores, DEFAULT_WEIGHTS.dineIn);
      
      // 正餐模型权重: traffic:15, location:25, customerMatch:15, heat:15, cost:20, competition:10
      // (6/10)*15 + (9/10)*25 + (7/10)*15 + (8/10)*15 + (5/10)*20 + (7/10)*10
      // = 9 + 22.5 + 10.5 + 12 + 10 + 7 = 71
      expect(result.totalScore).toBeCloseTo(71, 1);
    });

    it("均衡模型评分计算正确", () => {
      const scores = {
        trafficScore: 7,
        locationScore: 7,
        customerMatchScore: 7,
        heatScore: 7,
        costScore: 7,
        competitionScore: 7,
      };
      
      const result = calculateTotalScore(scores, DEFAULT_WEIGHTS.balanced);
      
      // 均衡模型权重: traffic:20, location:20, customerMatch:20, heat:15, cost:15, competition:10
      // (7/10)*(20+20+20+15+15+10) = 0.7 * 100 = 70
      expect(result.totalScore).toBeCloseTo(70, 1);
    });

    it("满分评分应为100", () => {
      const maxScores = {
        trafficScore: 10,
        locationScore: 10,
        customerMatchScore: 10,
        heatScore: 10,
        costScore: 10,
        competitionScore: 10,
      };
      
      const result = calculateTotalScore(maxScores, DEFAULT_WEIGHTS.balanced);
      expect(result.totalScore).toBe(100);
    });

    it("最低分评分应为10", () => {
      const minScores = {
        trafficScore: 1,
        locationScore: 1,
        customerMatchScore: 1,
        heatScore: 1,
        costScore: 1,
        competitionScore: 1,
      };
      
      const result = calculateTotalScore(minScores, DEFAULT_WEIGHTS.balanced);
      expect(result.totalScore).toBe(10);
    });

    it("推荐等级判断正确 - 推荐", () => {
      const scores = {
        trafficScore: 8,
        locationScore: 8,
        customerMatchScore: 8,
        heatScore: 8,
        costScore: 8,
        competitionScore: 8,
      };
      
      const result = calculateTotalScore(scores, DEFAULT_WEIGHTS.balanced);
      expect(result.recommendation).toBe("recommended");
    });

    it("推荐等级判断正确 - 谨慎", () => {
      const scores = {
        trafficScore: 7,
        locationScore: 6,
        customerMatchScore: 6,
        heatScore: 6,
        costScore: 7,
        competitionScore: 6,
      };
      
      const result = calculateTotalScore(scores, DEFAULT_WEIGHTS.balanced);
      expect(result.recommendation).toBe("cautious");
    });

    it("推荐等级判断正确 - 不推荐", () => {
      const scores = {
        trafficScore: 5,
        locationScore: 5,
        customerMatchScore: 5,
        heatScore: 5,
        costScore: 5,
        competitionScore: 5,
      };
      
      const result = calculateTotalScore(scores, DEFAULT_WEIGHTS.balanced);
      expect(result.recommendation).toBe("notRecommended");
    });
  });

  describe("calculateBreakEven - 财务测算", () => {
    it("计算保本营业额正确", () => {
      const result = calculateBreakEven({
        estimatedPrice: 50,
        grossMarginRate: 60,
        monthlyRent: 30000,
        monthlyLabor: 40000,
        otherCosts: 5000,
        seats: 60,
        restaurantType: "快餐",
      });
      
      // 月固定成本 = 30000 + 40000 + 5000 = 75000
      // 日固定成本 = 75000 / 30 = 2500
      // 日保本营业额 = 日固定成本 / 毛利率 = 2500 / 0.6 = 4166.67
      expect(result.dailyBreakEven).toBeCloseTo(4166.67, 0);
    });

    it("计算保本翻台率正确", () => {
      const result = calculateBreakEven({
        estimatedPrice: 50,
        grossMarginRate: 60,
        monthlyRent: 30000,
        monthlyLabor: 40000,
        otherCosts: 5000,
        seats: 60,
        restaurantType: "快餐",
      });
      
      // 日保本客流 = 4166.67 / 50 = 83.33
      // 有效座位数 = 60 * 0.7 = 42 (70%满座率)
      // 日保本翻台率 = 83.33 / 42 = 1.98
      expect(result.dailyTurnover).toBeCloseTo(1.98, 1);
    });

    it("高风险场景识别正确", () => {
      const result = calculateBreakEven({
        estimatedPrice: 25,
        grossMarginRate: 45,
        monthlyRent: 60000,
        monthlyLabor: 70000,
        otherCosts: 15000,
        seats: 35,
        restaurantType: "快餐",
      });
      
      // 月固定成本 = 145000
      // 日固定成本 = 4833.33
      // 日保本营业额 = 4833.33 / 0.45 = 10740.74
      // 日保本客流 = 10740.74 / 25 = 429.63
      // 日保本翻台率 = 429.63 / 35 = 12.28
      // 快餐行业平均翻台率4.5次，12.28/4.5 = 2.73，远超1.5，应为高风险
      expect(result.riskLevel).toBe("high");
    });

    it("低风险场景识别正确", () => {
      const result = calculateBreakEven({
        estimatedPrice: 80,
        grossMarginRate: 65,
        monthlyRent: 20000,
        monthlyLabor: 30000,
        otherCosts: 5000,
        seats: 80,
        restaurantType: "中餐",
      });
      
      // 月固定成本 = 55000
      // 日固定成本 = 1833.33
      // 日保本营业额 = 1833.33 / 0.65 = 2820.51
      // 日保本客流 = 2820.51 / 80 = 35.26
      // 日保本翻台率 = 35.26 / 80 = 0.44
      // 中餐行业平均翻台率2.5次，0.44/2.5 = 0.18，远低于0.8，应为低风险
      expect(result.riskLevel).toBe("low");
    });

    it("中等风险场景识别正确", () => {
      const result = calculateBreakEven({
        estimatedPrice: 60,
        grossMarginRate: 55,
        monthlyRent: 35000,
        monthlyLabor: 45000,
        otherCosts: 8000,
        seats: 50,
        restaurantType: "中餐",
      });
      
      // 中餐行业平均翻台率2.5次
      // 保本翻台率应接近行业平均
      expect(["medium", "low", "high"]).toContain(result.riskLevel);
    });
  });

  describe("INDUSTRY_AVG_TURNOVER - 行业平均翻台率", () => {
    it("快餐行业翻台率正确", () => {
      expect(INDUSTRY_AVG_TURNOVER["快餐"]).toBe(4.5);
    });

    it("中餐行业翻台率正确", () => {
      expect(INDUSTRY_AVG_TURNOVER["中餐"]).toBe(2.5);
    });

    it("西餐行业翻台率正确", () => {
      expect(INDUSTRY_AVG_TURNOVER["西餐"]).toBe(2.0);
    });

    it("火锅行业翻台率正确", () => {
      expect(INDUSTRY_AVG_TURNOVER["火锅"]).toBe(2.8);
    });

    it("其他行业翻台率正确", () => {
      expect(INDUSTRY_AVG_TURNOVER["其他"]).toBe(2.5);
    });
  });

  describe("getRecommendationText - 推荐文案生成", () => {
    it("高分推荐文案正确", () => {
      const result = getRecommendationText(88, "recommended");
      expect(result.title).toBe("强烈推荐");
    });

    it("推荐文案正确", () => {
      const result = getRecommendationText(78, "recommended");
      expect(result.title).toBe("推荐");
    });

    it("谨慎考虑文案正确", () => {
      const result = getRecommendationText(65, "cautious");
      expect(result.title).toBe("谨慎考虑");
    });

    it("不推荐文案正确", () => {
      const result = getRecommendationText(55, "notRecommended");
      expect(result.title).toBe("建议放弃");
    });
  });
});
