import { describe, it, expect } from 'vitest';
import { generateEvaluationPDF } from './pdfGenerator';
import { SiteEvaluation, Restaurant } from '../drizzle/schema';

describe('PDF Generator', () => {
  // 模拟餐厅数据
  const mockRestaurant: Restaurant = {
    id: 1,
    userId: 1,
    name: '测试餐厅',
    type: '中餐',
    priceRangeMin: 50,
    priceRangeMax: 100,
    targetCustomer: '白领',
    scale: '中型',
    businessModel: '堂食为主',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // 模拟评估数据
  const mockEvaluation: SiteEvaluation = {
    id: 1,
    userId: 1,
    restaurantId: 1,
    address: '上海市静安区测试路123号',
    latitude: '31.2345' as unknown as string,
    longitude: '121.4567' as unknown as string,
    area: 100,
    monthlyRent: 30000,
    hasSameCategory: 1,
    brandAName: '品牌A餐厅',
    brandAMonLunch: 80,
    brandAMonDinner: 90,
    brandAFriLunch: 85,
    brandAFriDinner: 95,
    brandASatLunch: 90,
    brandASatDinner: 100,
    brandBName: '品牌B餐厅',
    brandBMonLunch: 70,
    brandBMonDinner: 80,
    brandBFriLunch: 75,
    brandBFriDinner: 85,
    brandBSatLunch: 80,
    brandBSatDinner: 90,
    brandCName: null,
    brandCMonLunch: null,
    brandCMonDinner: null,
    brandCFriLunch: null,
    brandCFriDinner: null,
    brandCSatLunch: null,
    brandCSatDinner: null,
    isMainCorridor: 1,
    storefrontWidth: '6.5' as unknown as string,
    hasStairs: 0,
    hasDeepAlley: 0,
    surroundingDesc: '周边商业环境良好',
    population1km: 50000,
    population3km: 200000,
    officeBuildings: 10,
    estimatedWorkstations: 5000,
    parkingSpots: 200,
    ageGroup: '25-35',
    consumptionLevel: 'medium',
    trafficScore: 8,
    locationScore: 7,
    customerMatchScore: 8,
    heatScore: 7,
    costScore: 6,
    competitionScore: 7,
    totalScore: '75.50' as unknown as string,
    recommendation: '推荐',
    llmAnalysis: '这是一个测试的AI分析报告内容。',
    breakEvenRevenue: '5000.00' as unknown as string,
    breakEvenTurnover: '2.50' as unknown as string,
    financialRisk: '中等',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('should generate PDF buffer', async () => {
    const result = await generateEvaluationPDF({
      evaluation: mockEvaluation,
      restaurant: mockRestaurant,
    });

    expect(result).toBeInstanceOf(Buffer);
    expect(result.length).toBeGreaterThan(0);
  });

  it('should generate PDF with valid PDF header', async () => {
    const result = await generateEvaluationPDF({
      evaluation: mockEvaluation,
      restaurant: mockRestaurant,
    });

    // PDF文件应该以 %PDF- 开头
    const header = result.slice(0, 5).toString();
    expect(header).toBe('%PDF-');
  });

  it('should handle evaluation without brand data', async () => {
    const evaluationWithoutBrands: SiteEvaluation = {
      ...mockEvaluation,
      brandAName: null,
      brandAMonLunch: null,
      brandAMonDinner: null,
      brandAFriLunch: null,
      brandAFriDinner: null,
      brandASatLunch: null,
      brandASatDinner: null,
      brandBName: null,
      brandBMonLunch: null,
      brandBMonDinner: null,
      brandBFriLunch: null,
      brandBFriDinner: null,
      brandBSatLunch: null,
      brandBSatDinner: null,
    };

    const result = await generateEvaluationPDF({
      evaluation: evaluationWithoutBrands,
      restaurant: mockRestaurant,
    });

    expect(result).toBeInstanceOf(Buffer);
    expect(result.length).toBeGreaterThan(0);
  });

  it('should handle evaluation without LLM analysis', async () => {
    const evaluationWithoutAnalysis: SiteEvaluation = {
      ...mockEvaluation,
      llmAnalysis: null,
    };

    const result = await generateEvaluationPDF({
      evaluation: evaluationWithoutAnalysis,
      restaurant: mockRestaurant,
    });

    expect(result).toBeInstanceOf(Buffer);
    expect(result.length).toBeGreaterThan(0);
  });

  it('should handle evaluation without financial data', async () => {
    const evaluationWithoutFinancial: SiteEvaluation = {
      ...mockEvaluation,
      breakEvenRevenue: null,
      breakEvenTurnover: null,
      financialRisk: null,
    };

    const result = await generateEvaluationPDF({
      evaluation: evaluationWithoutFinancial,
      restaurant: mockRestaurant,
    });

    expect(result).toBeInstanceOf(Buffer);
    expect(result.length).toBeGreaterThan(0);
  });

  it('should handle all three brands', async () => {
    const evaluationWithAllBrands: SiteEvaluation = {
      ...mockEvaluation,
      brandCName: '品牌C餐厅',
      brandCMonLunch: 60,
      brandCMonDinner: 70,
      brandCFriLunch: 65,
      brandCFriDinner: 75,
      brandCSatLunch: 70,
      brandCSatDinner: 80,
    };

    const result = await generateEvaluationPDF({
      evaluation: evaluationWithAllBrands,
      restaurant: mockRestaurant,
    });

    expect(result).toBeInstanceOf(Buffer);
    expect(result.length).toBeGreaterThan(0);
  });
});
