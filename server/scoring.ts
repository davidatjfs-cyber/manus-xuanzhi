/**
 * 餐厅选址评分算法模块
 */

// 默认权重配置
export const DEFAULT_WEIGHTS = {
  // 快餐模型：客流量权重60%，租金权重30%，环境权重10%
  fastFood: {
    trafficWeight: 60,
    locationWeight: 10,
    customerMatchWeight: 10,
    heatWeight: 5,
    costWeight: 10,
    competitionWeight: 5,
  },
  // 正餐/聚餐模型：环境与停车位权重40%，周边社区成熟度30%，租金30%
  dineIn: {
    trafficWeight: 15,
    locationWeight: 25,
    customerMatchWeight: 15,
    heatWeight: 15,
    costWeight: 20,
    competitionWeight: 10,
  },
  // 默认均衡模型
  balanced: {
    trafficWeight: 20,
    locationWeight: 20,
    customerMatchWeight: 20,
    heatWeight: 15,
    costWeight: 15,
    competitionWeight: 10,
  },
};

// 行业平均翻台率参考
export const INDUSTRY_AVG_TURNOVER: Record<string, number> = {
  '快餐': 4.5,
  '中餐': 2.5,
  '西餐': 2.0,
  '日料': 2.2,
  '韩餐': 2.3,
  '火锅': 2.8,
  '烧烤': 2.5,
  '咖啡茶饮': 3.5,
  '其他': 2.5,
};

export interface ScoreWeights {
  trafficWeight: number;
  locationWeight: number;
  customerMatchWeight: number;
  heatWeight: number;
  costWeight: number;
  competitionWeight: number;
}

export interface EvaluationScores {
  trafficScore: number;      // 客流量评分 1-10
  locationScore: number;     // 铺位条件评分 1-10
  customerMatchScore: number; // 客群匹配度评分 1-10
  heatScore: number;         // 区域热力评分 1-10
  costScore: number;         // 成本评分 1-10
  competitionScore: number;  // 竞争评分 1-10
}

export interface CalculationResult {
  totalScore: number;        // 综合得分（百分制）
  recommendation: 'recommended' | 'cautious' | 'notRecommended';
  dimensionScores: {
    name: string;
    score: number;
    weight: number;
    weightedScore: number;
  }[];
}

/**
 * 计算综合得分
 */
export function calculateTotalScore(
  scores: EvaluationScores,
  weights: ScoreWeights
): CalculationResult {
  const dimensions = [
    { name: '客流量', score: scores.trafficScore, weight: weights.trafficWeight },
    { name: '铺位条件', score: scores.locationScore, weight: weights.locationWeight },
    { name: '客群匹配', score: scores.customerMatchScore, weight: weights.customerMatchWeight },
    { name: '区域热力', score: scores.heatScore, weight: weights.heatWeight },
    { name: '成本控制', score: scores.costScore, weight: weights.costWeight },
    { name: '竞争环境', score: scores.competitionScore, weight: weights.competitionWeight },
  ];

  // 计算加权得分
  const dimensionScores = dimensions.map(d => ({
    ...d,
    weightedScore: (d.score / 10) * d.weight,
  }));

  // 总分 = 各维度加权得分之和（百分制）
  const totalScore = dimensionScores.reduce((sum, d) => sum + d.weightedScore, 0);

  // 确定推荐等级
  let recommendation: 'recommended' | 'cautious' | 'notRecommended';
  if (totalScore >= 75) {
    recommendation = 'recommended';
  } else if (totalScore >= 60) {
    recommendation = 'cautious';
  } else {
    recommendation = 'notRecommended';
  }

  return {
    totalScore: Math.round(totalScore * 100) / 100,
    recommendation,
    dimensionScores,
  };
}

/**
 * 根据经营模式获取默认权重
 */
export function getDefaultWeights(businessModel: string): ScoreWeights {
  switch (businessModel) {
    case '快餐':
      return DEFAULT_WEIGHTS.fastFood;
    case '正餐':
    case '聚餐':
      return DEFAULT_WEIGHTS.dineIn;
    default:
      return DEFAULT_WEIGHTS.balanced;
  }
}

export interface FinancialInput {
  estimatedPrice: number;    // 预估客单价
  grossMarginRate: number;   // 预估毛利率(%)
  monthlyRent: number;       // 月租金
  monthlyLabor: number;      // 月人工成本
  otherCosts: number;        // 其他月成本
  seats: number;             // 座位数
  restaurantType: string;    // 餐厅类型
}

export interface FinancialResult {
  dailyBreakEven: number;    // 日保本营业额
  dailyTurnover: number;     // 日保本翻台率
  industryAvgTurnover: number; // 行业平均翻台率
  riskLevel: 'low' | 'medium' | 'high';
  riskDescription: string;
}

/**
 * 计算盈亏平衡点
 */
export function calculateBreakEven(input: FinancialInput): FinancialResult {
  // 月固定成本 = 租金 + 人工 + 其他
  const monthlyFixedCosts = input.monthlyRent + input.monthlyLabor + input.otherCosts;
  
  // 日固定成本
  const dailyFixedCosts = monthlyFixedCosts / 30;
  
  // 毛利率（转换为小数）
  const marginRate = input.grossMarginRate / 100;
  
  // 日保本营业额 = 日固定成本 / 毛利率
  const dailyBreakEven = dailyFixedCosts / marginRate;
  
  // 日保本客流 = 日保本营业额 / 客单价
  const dailyCustomers = dailyBreakEven / input.estimatedPrice;
  
  // 假设每天营业时间内可翻台2次（午餐+晚餐各1次为基准）
  // 实际满座率按70%计算（餐位数 × 70% = 1轮有效客流）
  const effectiveSeats = input.seats * 0.7;
  // 日保本翻台率 = 日保本客流 / 有效座位数
  const dailyTurnover = dailyCustomers / effectiveSeats;
  
  // 获取行业平均翻台率
  const industryAvgTurnover = INDUSTRY_AVG_TURNOVER[input.restaurantType] || 2.5;
  
  // 风险评估
  let riskLevel: 'low' | 'medium' | 'high';
  let riskDescription: string;
  
  const turnoverRatio = dailyTurnover / industryAvgTurnover;
  
  if (turnoverRatio <= 0.8) {
    riskLevel = 'low';
    riskDescription = '保本翻台率低于行业平均水平，盈利空间较大';
  } else if (turnoverRatio <= 1.2) {
    riskLevel = 'medium';
    riskDescription = '保本翻台率接近行业平均水平，需要精细化运营';
  } else if (turnoverRatio <= 1.5) {
    riskLevel = 'medium';
    riskDescription = '保本翻台率略高于行业平均，存在一定经营压力';
  } else {
    riskLevel = 'high';
    riskDescription = `保本翻台率(${dailyTurnover.toFixed(1)}次)远超行业平均(${industryAvgTurnover}次)，高风险预警！建议重新评估成本结构或选址`;
  }
  
  return {
    dailyBreakEven: Math.round(dailyBreakEven * 100) / 100,
    dailyTurnover: Math.round(dailyTurnover * 100) / 100,
    industryAvgTurnover,
    riskLevel,
    riskDescription,
  };
}

/**
 * 生成推荐建议文案
 */
export function getRecommendationText(
  totalScore: number,
  recommendation: string
): { title: string; description: string } {
  if (totalScore >= 85) {
    return {
      title: '强烈推荐',
      description: '该选址各项指标优秀，建议优先考虑。客流充足、位置优越、成本可控，是理想的开店位置。',
    };
  } else if (totalScore >= 75) {
    return {
      title: '推荐',
      description: '该选址综合条件良好，可以考虑。建议关注个别较低分项，针对性优化经营策略。',
    };
  } else if (totalScore >= 60) {
    return {
      title: '谨慎考虑',
      description: '该选址存在一定风险因素，主要风险点可能在于租金占比过高或客流不足。建议与房东协商租金或调整经营模式。',
    };
  } else {
    return {
      title: '建议放弃',
      description: '该选址综合评分较低，可能存在工程条件不符、客流严重不足或成本过高等问题。建议寻找其他更合适的位置。',
    };
  }
}
