// 测试通过API调用PDF生成
import { generateEvaluationPDF } from './server/pdfGenerator';
import fs from 'fs';

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
    llmAnalysis: '这是AI分析内容',
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
  console.log('Testing API PDF generation...');
  try {
    const buffer = await generateEvaluationPDF(mockData as any);
    console.log('Buffer type:', typeof buffer);
    console.log('Buffer is Buffer:', Buffer.isBuffer(buffer));
    console.log('Buffer length:', buffer.length);
    
    // 测试base64转换
    const base64 = buffer.toString('base64');
    console.log('Base64 length:', base64.length);
    console.log('Base64 preview:', base64.substring(0, 100));
    
    // 保存原始buffer
    fs.writeFileSync('/tmp/api-test.pdf', buffer);
    console.log('Saved to /tmp/api-test.pdf');
    
    // 测试从base64还原
    const restored = Buffer.from(base64, 'base64');
    console.log('Restored buffer length:', restored.length);
    fs.writeFileSync('/tmp/api-test-restored.pdf', restored);
    console.log('Saved restored to /tmp/api-test-restored.pdf');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

test();
