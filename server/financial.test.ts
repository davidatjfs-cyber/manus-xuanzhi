import { describe, it, expect } from 'vitest';

// 模拟前端的财务计算逻辑
function calculateFinancials(params: {
  monthlyRent: number;
  monthlyLabor: number;
  otherCosts: number;
  grossMarginRate: number;
  estimatedPrice: number;
  seats: number;
  estimatedMonthlyRevenue: number;
  estimatedInvestment: number;
}) {
  const {
    monthlyRent,
    monthlyLabor,
    otherCosts,
    grossMarginRate,
    estimatedPrice,
    seats,
    estimatedMonthlyRevenue,
    estimatedInvestment,
  } = params;

  // 月固定成本
  const monthlyFixedCosts = monthlyRent + monthlyLabor + otherCosts;
  
  // 保本月营业额 = 月固定成本 / 毛利率
  const breakEvenRevenue = grossMarginRate > 0 ? monthlyFixedCosts / (grossMarginRate / 100) : 0;
  
  // 保本日营业额
  const dailyBreakEven = breakEvenRevenue / 30;
  
  // 保本翻台率 = 日保本营业额 / (有效座位数 * 客单价)
  // 实际满座率按70%计算（餐位数 × 70% = 1轮有效客流）
  const effectiveSeats = seats * 0.7;
  const dailyTurnover = (effectiveSeats > 0 && estimatedPrice > 0) 
    ? dailyBreakEven / (effectiveSeats * estimatedPrice) 
    : 0;
  
  // 月利润 = 月营收 * 毛利率 - 月固定成本
  const monthlyProfit = estimatedMonthlyRevenue * (grossMarginRate / 100) - monthlyFixedCosts;
  
  // 回本周期（月）
  const paybackPeriod = (monthlyProfit > 0 && estimatedInvestment > 0) 
    ? Math.ceil(estimatedInvestment / monthlyProfit) 
    : 0;
  
  // 年投资回报率
  const annualROI = estimatedInvestment > 0 
    ? ((monthlyProfit * 12) / estimatedInvestment) * 100 
    : 0;
  
  return {
    monthlyFixedCosts,
    breakEvenRevenue,
    dailyBreakEven,
    dailyTurnover,
    monthlyProfit,
    paybackPeriod,
    annualROI,
    estimatedInvestment,
  };
}

describe('财务计算', () => {
  describe('月固定成本计算', () => {
    it('应该正确计算月固定成本', () => {
      const result = calculateFinancials({
        monthlyRent: 30000,
        monthlyLabor: 50000,
        otherCosts: 10000,
        grossMarginRate: 60,
        estimatedPrice: 80,
        seats: 60,
        estimatedMonthlyRevenue: 300000,
        estimatedInvestment: 500000,
      });
      
      expect(result.monthlyFixedCosts).toBe(90000);
    });
  });

  describe('保本月营业额计算', () => {
    it('应该正确计算保本月营业额', () => {
      const result = calculateFinancials({
        monthlyRent: 30000,
        monthlyLabor: 50000,
        otherCosts: 10000,
        grossMarginRate: 60,
        estimatedPrice: 80,
        seats: 60,
        estimatedMonthlyRevenue: 300000,
        estimatedInvestment: 500000,
      });
      
      // 保本营业额 = 90000 / 0.6 = 150000
      expect(result.breakEvenRevenue).toBe(150000);
    });

    it('毛利率为0时保本营业额应为0', () => {
      const result = calculateFinancials({
        monthlyRent: 30000,
        monthlyLabor: 50000,
        otherCosts: 10000,
        grossMarginRate: 0,
        estimatedPrice: 80,
        seats: 60,
        estimatedMonthlyRevenue: 300000,
        estimatedInvestment: 500000,
      });
      
      expect(result.breakEvenRevenue).toBe(0);
    });
  });

  describe('保本翻台率计算', () => {
    it('应该正确计算保本翻台率', () => {
      const result = calculateFinancials({
        monthlyRent: 30000,
        monthlyLabor: 50000,
        otherCosts: 10000,
        grossMarginRate: 60,
        estimatedPrice: 80,
        seats: 60,
        estimatedMonthlyRevenue: 300000,
        estimatedInvestment: 500000,
      });
      
      // 日保本营业额 = 150000 / 30 = 5000
      // 有效座位数 = 60 * 0.7 = 42
      // 保本翻台率 = 5000 / (42 * 80) = 5000 / 3360 ≈ 1.49
      expect(result.dailyTurnover).toBeCloseTo(1.49, 2);
    });

    it('座位数或客单价为0时翻台率应为0', () => {
      const result = calculateFinancials({
        monthlyRent: 30000,
        monthlyLabor: 50000,
        otherCosts: 10000,
        grossMarginRate: 60,
        estimatedPrice: 0,
        seats: 60,
        estimatedMonthlyRevenue: 300000,
        estimatedInvestment: 500000,
      });
      
      expect(result.dailyTurnover).toBe(0);
    });
  });

  describe('月利润计算', () => {
    it('应该正确计算月利润', () => {
      const result = calculateFinancials({
        monthlyRent: 30000,
        monthlyLabor: 50000,
        otherCosts: 10000,
        grossMarginRate: 60,
        estimatedPrice: 80,
        seats: 60,
        estimatedMonthlyRevenue: 300000,
        estimatedInvestment: 500000,
      });
      
      // 月利润 = 300000 * 0.6 - 90000 = 180000 - 90000 = 90000
      expect(result.monthlyProfit).toBe(90000);
    });

    it('应该正确计算亏损情况', () => {
      const result = calculateFinancials({
        monthlyRent: 50000,
        monthlyLabor: 80000,
        otherCosts: 20000,
        grossMarginRate: 60,
        estimatedPrice: 80,
        seats: 60,
        estimatedMonthlyRevenue: 200000,
        estimatedInvestment: 500000,
      });
      
      // 月利润 = 200000 * 0.6 - 150000 = 120000 - 150000 = -30000
      expect(result.monthlyProfit).toBe(-30000);
    });
  });

  describe('回本周期计算', () => {
    it('应该正确计算回本周期', () => {
      const result = calculateFinancials({
        monthlyRent: 30000,
        monthlyLabor: 50000,
        otherCosts: 10000,
        grossMarginRate: 60,
        estimatedPrice: 80,
        seats: 60,
        estimatedMonthlyRevenue: 300000,
        estimatedInvestment: 500000,
      });
      
      // 回本周期 = 500000 / 90000 ≈ 5.56 → 6个月
      expect(result.paybackPeriod).toBe(6);
    });

    it('亏损时回本周期应为0', () => {
      const result = calculateFinancials({
        monthlyRent: 50000,
        monthlyLabor: 80000,
        otherCosts: 20000,
        grossMarginRate: 60,
        estimatedPrice: 80,
        seats: 60,
        estimatedMonthlyRevenue: 200000,
        estimatedInvestment: 500000,
      });
      
      expect(result.paybackPeriod).toBe(0);
    });
  });

  describe('年投资回报率计算', () => {
    it('应该正确计算年投资回报率', () => {
      const result = calculateFinancials({
        monthlyRent: 30000,
        monthlyLabor: 50000,
        otherCosts: 10000,
        grossMarginRate: 60,
        estimatedPrice: 80,
        seats: 60,
        estimatedMonthlyRevenue: 300000,
        estimatedInvestment: 500000,
      });
      
      // 年ROI = (90000 * 12) / 500000 * 100 = 216%
      expect(result.annualROI).toBeCloseTo(216, 0);
    });

    it('投资为0时年ROI应为0', () => {
      const result = calculateFinancials({
        monthlyRent: 30000,
        monthlyLabor: 50000,
        otherCosts: 10000,
        grossMarginRate: 60,
        estimatedPrice: 80,
        seats: 60,
        estimatedMonthlyRevenue: 300000,
        estimatedInvestment: 0,
      });
      
      expect(result.annualROI).toBe(0);
    });
  });
});
