import puppeteer from 'puppeteer';
import { SiteEvaluation } from '../drizzle/schema';
import { Restaurant } from '../drizzle/schema';

interface EvaluationData {
  evaluation: SiteEvaluation;
  restaurant: Restaurant;
}

/**
 * 生成评估报告PDF（使用Puppeteer渲染HTML）
 */
export async function generateEvaluationPDF(data: EvaluationData): Promise<Buffer> {
  const { evaluation, restaurant } = data;
  
  // 生成HTML内容
  const html = generateHTMLReport(data);
  
  // 使用Puppeteer生成PDF
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
      printBackground: true,
    });
    
    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}

/**
 * 生成HTML报告
 */
function generateHTMLReport(data: EvaluationData): string {
  const { evaluation, restaurant } = data;
  const totalScore = parseFloat(evaluation.totalScore?.toString() || '0');
  const recommendation = evaluation.recommendation || '待评估';
  
  // 评分颜色
  let gradeColor = '#666';
  let gradeBg = '#f5f5f5';
  if (recommendation === '强烈推荐' || recommendation === 'stronglyRecommended') {
    gradeColor = '#22c55e';
    gradeBg = '#dcfce7';
  } else if (recommendation === '推荐' || recommendation === 'recommended') {
    gradeColor = '#3b82f6';
    gradeBg = '#dbeafe';
  } else if (recommendation === '谨慎' || recommendation === 'cautious') {
    gradeColor = '#f59e0b';
    gradeBg = '#fef3c7';
  } else if (recommendation === '不推荐' || recommendation === 'notRecommended') {
    gradeColor = '#ef4444';
    gradeBg = '#fee2e2';
  }

  // 转换推荐等级为中文
  const recommendationText = getRecommendationText(recommendation);

  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>选址评估报告 - ${evaluation.address}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: "Microsoft YaHei", "SimHei", "WenQuanYi Zen Hei", "Noto Sans CJK SC", sans-serif;
      font-size: 12px;
      line-height: 1.6;
      color: #333;
      background: #fff;
    }
    .page {
      padding: 20px;
      page-break-after: always;
    }
    .page:last-child {
      page-break-after: auto;
    }
    .cover {
      text-align: center;
      padding-top: 100px;
    }
    .cover h1 {
      font-size: 32px;
      color: #1a1a2e;
      margin-bottom: 20px;
    }
    .cover .address {
      font-size: 16px;
      color: #666;
      margin-bottom: 60px;
    }
    .score-box {
      display: inline-block;
      padding: 30px 60px;
      background: ${gradeBg};
      border-radius: 16px;
      margin-bottom: 20px;
    }
    .score-value {
      font-size: 64px;
      font-weight: bold;
      color: ${gradeColor};
    }
    .score-label {
      font-size: 14px;
      color: #666;
      margin-top: 10px;
    }
    .recommendation {
      font-size: 24px;
      color: ${gradeColor};
      margin-top: 20px;
    }
    .timestamp {
      font-size: 12px;
      color: #999;
      margin-top: 60px;
    }
    .section {
      margin-bottom: 24px;
    }
    .section-title {
      font-size: 16px;
      font-weight: bold;
      color: #1a1a2e;
      padding-bottom: 8px;
      border-bottom: 2px solid #e5e5e5;
      margin-bottom: 16px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }
    .info-item {
      display: flex;
    }
    .info-label {
      color: #666;
      min-width: 100px;
    }
    .info-value {
      color: #333;
      font-weight: 500;
    }
    .score-bar-container {
      margin-bottom: 12px;
    }
    .score-bar-label {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
    }
    .score-bar {
      height: 8px;
      background: #e5e5e5;
      border-radius: 4px;
      overflow: hidden;
    }
    .score-bar-fill {
      height: 100%;
      border-radius: 4px;
    }
    .brand-section {
      background: #f9fafb;
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 12px;
    }
    .brand-name {
      font-weight: bold;
      margin-bottom: 8px;
    }
    .brand-data {
      font-size: 11px;
      color: #666;
    }
    .analysis-content {
      font-size: 11px;
      line-height: 1.8;
      white-space: pre-wrap;
    }
    .footer {
      text-align: center;
      font-size: 10px;
      color: #999;
      margin-top: 40px;
    }
  </style>
</head>
<body>
  <!-- 封面 -->
  <div class="page cover">
    <h1>餐饮选址评估报告</h1>
    <p class="address">${evaluation.address}</p>
    <div class="score-box">
      <div class="score-value">${totalScore.toFixed(1)}</div>
      <div class="score-label">综合得分</div>
    </div>
    <div class="recommendation">${recommendationText}</div>
    <p class="timestamp">生成时间: ${new Date().toLocaleString('zh-CN')}</p>
  </div>

  <!-- 基本信息 -->
  <div class="page">
    <div class="section">
      <h2 class="section-title">餐厅项目信息</h2>
      <div class="info-grid">
        <div class="info-item"><span class="info-label">项目名称：</span><span class="info-value">${restaurant.name}</span></div>
        <div class="info-item"><span class="info-label">餐厅类型：</span><span class="info-value">${restaurant.type}</span></div>
        <div class="info-item"><span class="info-label">客单价范围：</span><span class="info-value">${restaurant.priceRangeMin}-${restaurant.priceRangeMax}元</span></div>
        <div class="info-item"><span class="info-label">目标客群：</span><span class="info-value">${restaurant.targetCustomer}</span></div>
        <div class="info-item"><span class="info-label">经营规模：</span><span class="info-value">${restaurant.scale}</span></div>
        <div class="info-item"><span class="info-label">经营模式：</span><span class="info-value">${restaurant.businessModel}</span></div>
      </div>
    </div>

    <div class="section">
      <h2 class="section-title">选址基本信息</h2>
      <div class="info-grid">
        <div class="info-item"><span class="info-label">详细地址：</span><span class="info-value">${evaluation.address}</span></div>
        <div class="info-item"><span class="info-label">铺位面积：</span><span class="info-value">${evaluation.area}㎡</span></div>
        <div class="info-item"><span class="info-label">月租金：</span><span class="info-value">${evaluation.monthlyRent.toLocaleString()}元</span></div>
        <div class="info-item"><span class="info-label">坐标：</span><span class="info-value">${evaluation.latitude && evaluation.longitude ? `${evaluation.latitude}, ${evaluation.longitude}` : '未设置'}</span></div>
      </div>
    </div>

    <div class="section">
      <h2 class="section-title">铺位条件</h2>
      <div class="info-grid">
        <div class="info-item"><span class="info-label">主通道位置：</span><span class="info-value">${evaluation.isMainCorridor ? '是' : '否'}</span></div>
        <div class="info-item"><span class="info-label">门头宽度：</span><span class="info-value">${evaluation.storefrontWidth ? `${evaluation.storefrontWidth}米` : '未填写'}</span></div>
        <div class="info-item"><span class="info-label">需要上台阶：</span><span class="info-value">${evaluation.hasStairs ? '是' : '否'}</span></div>
        <div class="info-item"><span class="info-label">进深巷：</span><span class="info-value">${evaluation.hasDeepAlley ? '是' : '否'}</span></div>
      </div>
    </div>

    <div class="section">
      <h2 class="section-title">周边环境</h2>
      <div class="info-grid">
        <div class="info-item"><span class="info-label">1km常住人口：</span><span class="info-value">${evaluation.population1km ? `${evaluation.population1km.toLocaleString()}人` : '未填写'}</span></div>
        <div class="info-item"><span class="info-label">3km常住人口：</span><span class="info-value">${evaluation.population3km ? `${evaluation.population3km.toLocaleString()}人` : '未填写'}</span></div>
        <div class="info-item"><span class="info-label">周边写字楼：</span><span class="info-value">${evaluation.officeBuildings ? `${evaluation.officeBuildings}栋` : '未填写'}</span></div>
        <div class="info-item"><span class="info-label">预估工位数：</span><span class="info-value">${evaluation.estimatedWorkstations ? `${evaluation.estimatedWorkstations.toLocaleString()}个` : '未填写'}</span></div>
        <div class="info-item"><span class="info-label">停车位：</span><span class="info-value">${evaluation.parkingSpots ? `${evaluation.parkingSpots}个` : '未填写'}</span></div>
        <div class="info-item"><span class="info-label">主要年龄层：</span><span class="info-value">${evaluation.ageGroup || '未填写'}</span></div>
        <div class="info-item"><span class="info-label">消费能力：</span><span class="info-value">${evaluation.consumptionLevel || '未填写'}</span></div>
      </div>
    </div>
  </div>

  <!-- 评分详情 -->
  <div class="page">
    <div class="section">
      <h2 class="section-title">评分详情</h2>
      ${generateScoreBar('客流量评分', evaluation.trafficScore, 10)}
      ${generateScoreBar('铺位条件评分', evaluation.locationScore, 10)}
      ${generateScoreBar('客群匹配度评分', evaluation.customerMatchScore, 10)}
      ${generateScoreBar('区域热力评分', evaluation.heatScore, 10)}
      ${generateScoreBar('成本评分', evaluation.costScore, 10)}
      ${generateScoreBar('竞争评分', evaluation.competitionScore, 10)}
    </div>

    ${evaluation.brandAName || evaluation.brandBName || evaluation.brandCName ? `
    <div class="section">
      <h2 class="section-title">周边餐厅市调</h2>
      <p style="margin-bottom: 12px;">同品类餐厅: ${evaluation.hasSameCategory ? '有' : '无'}</p>
      ${evaluation.brandAName ? generateBrandSection('品牌A', evaluation.brandAName, '#0d9488', evaluation) : ''}
      ${evaluation.brandBName ? generateBrandSection('品牌B', evaluation.brandBName, '#d97706', evaluation) : ''}
      ${evaluation.brandCName ? generateBrandSection('品牌C', evaluation.brandCName, '#7c3aed', evaluation) : ''}
    </div>
    ` : ''}

    ${evaluation.breakEvenRevenue || evaluation.breakEvenTurnover ? `
    <div class="section">
      <h2 class="section-title">财务分析</h2>
      <div class="info-grid">
        <div class="info-item"><span class="info-label">保本日营业额：</span><span class="info-value">${evaluation.breakEvenRevenue ? `${parseFloat(evaluation.breakEvenRevenue.toString()).toLocaleString()}元` : '未计算'}</span></div>
        <div class="info-item"><span class="info-label">保本翻台率：</span><span class="info-value">${evaluation.breakEvenTurnover ? `${parseFloat(evaluation.breakEvenTurnover.toString()).toFixed(2)}次/天` : '未计算'}</span></div>
        <div class="info-item"><span class="info-label">财务风险：</span><span class="info-value">${evaluation.financialRisk || '未评估'}</span></div>
      </div>
    </div>
    ` : ''}
  </div>

  ${evaluation.llmAnalysis ? `
  <!-- AI分析报告 -->
  <div class="page">
    <div class="section">
      <h2 class="section-title">AI智能分析报告</h2>
      <div class="analysis-content">${formatAnalysis(evaluation.llmAnalysis)}</div>
    </div>
  </div>
  ` : ''}

  <div class="footer">
    餐饮选址智能评估系统 - 报告生成于 ${new Date().toLocaleString('zh-CN')}
  </div>
</body>
</html>
  `;
}

/**
 * 生成评分条HTML
 */
function generateScoreBar(label: string, score: number | null, max: number): string {
  const scoreValue = score ?? 0;
  const percentage = (scoreValue / max) * 100;
  
  let barColor = '#22c55e';
  if (percentage < 40) barColor = '#ef4444';
  else if (percentage < 60) barColor = '#f59e0b';
  else if (percentage < 80) barColor = '#3b82f6';
  
  return `
    <div class="score-bar-container">
      <div class="score-bar-label">
        <span>${label}</span>
        <span>${scoreValue}/${max}</span>
      </div>
      <div class="score-bar">
        <div class="score-bar-fill" style="width: ${percentage}%; background: ${barColor};"></div>
      </div>
    </div>
  `;
}

/**
 * 生成品牌市调HTML
 */
function generateBrandSection(brandLabel: string, brandName: string, color: string, evaluation: SiteEvaluation): string {
  const prefix = brandLabel === '品牌A' ? 'brandA' : brandLabel === '品牌B' ? 'brandB' : 'brandC';
  
  return `
    <div class="brand-section">
      <div class="brand-name" style="color: ${color};">${brandLabel}: ${brandName}</div>
      <div class="brand-data">
        周一: 午市 ${(evaluation as any)[`${prefix}MonLunch`] ?? '-'}% / 晚市 ${(evaluation as any)[`${prefix}MonDinner`] ?? '-'}%<br>
        周五: 午市 ${(evaluation as any)[`${prefix}FriLunch`] ?? '-'}% / 晚市 ${(evaluation as any)[`${prefix}FriDinner`] ?? '-'}%<br>
        周六: 午市 ${(evaluation as any)[`${prefix}SatLunch`] ?? '-'}% / 晚市 ${(evaluation as any)[`${prefix}SatDinner`] ?? '-'}%
      </div>
    </div>
  `;
}

/**
 * 格式化AI分析内容
 */
function formatAnalysis(text: string): string {
  return text
    .replace(/#{1,6}\s/g, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/`/g, '')
    .replace(/\n/g, '<br>');
}

/**
 * 获取推荐等级中文文本
 */
function getRecommendationText(recommendation: string): string {
  const map: Record<string, string> = {
    'stronglyRecommended': '强烈推荐',
    'recommended': '推荐',
    'cautious': '谨慎考虑',
    'notRecommended': '不推荐',
    '强烈推荐': '强烈推荐',
    '推荐': '推荐',
    '谨慎': '谨慎考虑',
    '不推荐': '不推荐',
  };
  return map[recommendation] || recommendation;
}
