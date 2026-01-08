import { generateEvaluationPDF } from './server/pdfGenerator';

const mockData = {
  evaluation: {
    id: 1,
    userId: 'test',
    restaurantId: 1,
    address: '上海市静安区南京西路1788号',
    area: 120,
    monthlyRent: 35000,
    latitude: '31.2304',
    longitude: '121.4737',
    isMainCorridor: false,
    storefrontWidth: '8.00',
    hasStairs: false,
    hasDeepAlley: false,
    population1km: 80000,
    population3km: 300000,
    officeBuildings: 8,
    estimatedWorkstations: 15000,
    parkingSpots: 800,
    ageGroup: '25-35岁',
    consumptionLevel: '中等消费',
    hasSameCategory: true,
    brandAName: '测试品牌A',
    brandAMonLunch: 70,
    brandAMonDinner: 80,
    brandAFriLunch: 75,
    brandAFriDinner: 85,
    brandASatLunch: 80,
    brandASatDinner: 90,
    brandBName: null,
    brandCName: null,
    trafficScore: 5,
    locationScore: 5,
    customerMatchScore: 5,
    heatScore: 5,
    costScore: 5,
    competitionScore: 5,
    totalScore: '50.00',
    recommendation: 'notRecommended',
    breakEvenRevenue: '5000',
    breakEvenTurnover: '2.5',
    financialRisk: '高风险',
    llmAnalysis: '这是一段AI分析内容，用于测试PDF生成。\n\n## 综合评价\n该选址位于上海核心商圈。',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  restaurant: {
    id: 1,
    userId: 'test',
    name: '测试川菜馆',
    type: '中餐',
    priceRangeMin: 0,
    priceRangeMax: 80,
    targetCustomer: '白领',
    scale: '中型',
    businessModel: '正餐',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
};

async function test() {
  console.log('Testing PDF generation...');
  try {
    const buffer = await generateEvaluationPDF(mockData as any);
    console.log('PDF generated successfully!');
    console.log('Buffer size:', buffer.length);
    
    const fs = await import('fs');
    fs.writeFileSync('/tmp/full-test.pdf', buffer);
    console.log('PDF saved to /tmp/full-test.pdf');
  } catch (error) {
    console.error('Error:', error);
  }
}

test();
