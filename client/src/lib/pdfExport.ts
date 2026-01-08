import { jsPDF } from 'jspdf';

interface EvaluationData {
  evaluation: {
    id: number;
    address: string;
    area: number;
    monthlyRent: number;
    totalScore: string | number | null;
    recommendation: string | null;
    trafficScore: number | null;
    locationScore: number | null;
    customerMatchScore: number | null;
    heatScore: number | null;
    costScore: number | null;
    competitionScore: number | null;
    isMainCorridor: boolean | null;
    storefrontWidth: string | number | null;
    hasStairs: boolean | null;
    hasDeepAlley: boolean | null;
    population1km: number | null;
    population3km: number | null;
    officeBuildings: number | null;
    estimatedWorkstations: number | null;
    parkingSpots: number | null;
    ageGroup: string | null;
    consumptionLevel: string | null;
    llmAnalysis: string | null;
    brandAName: string | null;
    brandBName: string | null;
    brandCName: string | null;
    hasSameCategory: boolean | null;
    breakEvenRevenue: string | number | null;
    breakEvenTurnover: string | number | null;
    financialRisk: string | null;
    latitude?: string | number | null;
    longitude?: string | number | null;
    [key: string]: any;
  };
  restaurant: {
    name: string;
    type: string;
    priceRangeMin: number;
    priceRangeMax: number;
    targetCustomer: string;
    scale: string;
    businessModel: string;
  };
}

// 获取推荐等级中文文本
function getRecommendationText(recommendation: string | null): string {
  const map: Record<string, string> = {
    'stronglyRecommended': '强烈推荐',
    'recommended': '推荐',
    'cautious': '谨慎考虑',
    'notRecommended': '不推荐',
    '强烈推荐': '强烈推荐',
    '推荐': '推荐',
    '谨慎': '谨慎考虑',
    '谨慎考虑': '谨慎考虑',
    '不推荐': '不推荐',
    '建议放弃': '建议放弃',
  };
  return map[recommendation || ''] || recommendation || '待评估';
}

// 创建打印用的HTML内容
function createPrintContent(data: EvaluationData): string {
  const { evaluation, restaurant } = data;
  const totalScore = parseFloat(evaluation.totalScore?.toString() || '0');
  const recommendation = evaluation.recommendation || '待评估';
  const recommendationText = getRecommendationText(recommendation);
  
  // 根据推荐等级设置颜色
  let recommendationColor = '#ef4444'; // red
  if (recommendationText === '强烈推荐') {
    recommendationColor = '#22c55e';
  } else if (recommendationText === '推荐') {
    recommendationColor = '#3b82f6';
  } else if (recommendationText === '谨慎考虑') {
    recommendationColor = '#f59e0b';
  }

  // 处理AI分析内容
  let aiAnalysisHtml = '';
  if (evaluation.llmAnalysis) {
    let content = evaluation.llmAnalysis
      .replace(/### (.*)/g, '<h4 style="color:#1a1a2e;margin:15px 0 8px 0;font-size:14px;">$1</h4>')
      .replace(/## (.*)/g, '<h3 style="color:#1a1a2e;margin:20px 0 10px 0;font-size:16px;">$1</h3>')
      .replace(/# (.*)/g, '<h2 style="color:#1a1a2e;margin:25px 0 12px 0;font-size:18px;">$1</h2>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^\d+\.\s+(.*)/gm, '<li style="margin:5px 0;">$1</li>')
      .replace(/^-\s+(.*)/gm, '<li style="margin:5px 0;">$1</li>')
      .replace(/\n\n/g, '</p><p style="margin:10px 0;line-height:1.6;">')
      .replace(/\n/g, '<br/>');
    
    aiAnalysisHtml = `
      <div style="page-break-before: always; padding: 20px 0;">
        <h2 style="color:#1a1a2e;border-bottom:2px solid #e5e5e5;padding-bottom:10px;margin-bottom:20px;font-size:18px;">AI 智能分析报告</h2>
        <div style="font-size:12px;color:#404040;line-height:1.8;">
          <p style="margin:10px 0;line-height:1.6;">${content}</p>
        </div>
      </div>
    `;
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>餐饮选址评估报告 - ${evaluation.address}</title>
      <style>
        @page { size: A4; margin: 15mm; }
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .page-break { page-break-before: always; }
        }
        body {
          font-family: 'Microsoft YaHei', 'SimHei', 'PingFang SC', 'Noto Sans SC', sans-serif;
          margin: 0;
          padding: 20px;
          color: #333;
          background: white;
          font-size: 12px;
          line-height: 1.6;
        }
        .header {
          text-align: center;
          padding: 30px 0;
          border-bottom: 2px solid #e5e5e5;
          margin-bottom: 25px;
        }
        .header h1 {
          font-size: 22px;
          color: #1a1a2e;
          margin: 0 0 8px 0;
        }
        .header .address {
          font-size: 13px;
          color: #666;
          margin-bottom: 25px;
        }
        .score-box {
          display: inline-block;
          background: ${recommendationColor};
          border-radius: 10px;
          padding: 15px 35px;
          text-align: center;
          margin-bottom: 15px;
        }
        .score-box .score {
          font-size: 42px;
          color: white;
          font-weight: bold;
        }
        .score-box .label {
          font-size: 11px;
          color: rgba(255,255,255,0.9);
          margin-top: 3px;
        }
        .recommendation {
          font-size: 18px;
          color: ${recommendationColor};
          font-weight: bold;
          margin-bottom: 15px;
        }
        .section {
          margin-bottom: 20px;
        }
        .section h2 {
          color: #1a1a2e;
          border-bottom: 2px solid #e5e5e5;
          padding-bottom: 6px;
          margin-bottom: 12px;
          font-size: 15px;
        }
        .info-table {
          width: 100%;
          border-collapse: collapse;
        }
        .info-table td {
          padding: 6px 0;
          border-bottom: 1px solid #f0f0f0;
          font-size: 11px;
        }
        .info-table td:first-child {
          color: #666;
          width: 100px;
        }
        .info-table td:last-child {
          color: #333;
        }
        .score-item {
          margin-bottom: 12px;
        }
        .score-item .label-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 4px;
          font-size: 11px;
        }
        .score-item .bar-bg {
          background: #e5e5e5;
          border-radius: 3px;
          height: 6px;
          overflow: hidden;
        }
        .score-item .bar {
          height: 100%;
          border-radius: 3px;
        }
        .footer {
          text-align: center;
          padding: 15px;
          color: #999;
          font-size: 10px;
          border-top: 1px solid #e5e5e5;
          margin-top: 25px;
        }
        .two-column {
          display: flex;
          gap: 25px;
        }
        .two-column > div {
          flex: 1;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>餐饮选址评估报告</h1>
        <p class="address">${evaluation.address}</p>
        <div class="score-box">
          <div class="score">${totalScore.toFixed(1)}</div>
          <div class="label">综合得分</div>
        </div>
        <div class="recommendation">${recommendationText}</div>
        <p style="color:#999;font-size:10px;">生成时间：${new Date().toLocaleString('zh-CN')}</p>
      </div>
      
      <div class="two-column">
        <div class="section">
          <h2>餐厅项目信息</h2>
          <table class="info-table">
            <tr><td>餐厅名称</td><td>${restaurant.name}</td></tr>
            <tr><td>餐厅类型</td><td>${restaurant.type}</td></tr>
            <tr><td>客单价范围</td><td>¥${restaurant.priceRangeMin}-${restaurant.priceRangeMax}</td></tr>
            <tr><td>目标客群</td><td>${restaurant.targetCustomer}</td></tr>
            <tr><td>餐厅规模</td><td>${restaurant.scale}</td></tr>
            <tr><td>经营模式</td><td>${restaurant.businessModel}</td></tr>
          </table>
        </div>
        
        <div class="section">
          <h2>选址基本信息</h2>
          <table class="info-table">
            <tr><td>地址</td><td>${evaluation.address}</td></tr>
            <tr><td>铺位面积</td><td>${evaluation.area} ㎡</td></tr>
            <tr><td>月租金</td><td>¥${evaluation.monthlyRent.toLocaleString()}</td></tr>
            <tr><td>租金单价</td><td>¥${(evaluation.monthlyRent / evaluation.area).toFixed(0)}/㎡</td></tr>
          </table>
        </div>
      </div>
      
      <div class="two-column">
        <div class="section">
          <h2>铺位条件</h2>
          <table class="info-table">
            <tr><td>主通道位置</td><td>${evaluation.isMainCorridor ? '是' : '否'}</td></tr>
            <tr><td>门头宽度</td><td>${evaluation.storefrontWidth || 'N/A'} 米</td></tr>
            <tr><td>需上台阶</td><td>${evaluation.hasStairs ? '是' : '否'}</td></tr>
            <tr><td>进深巷</td><td>${evaluation.hasDeepAlley ? '是' : '否'}</td></tr>
          </table>
        </div>
        
        <div class="section">
          <h2>周边环境</h2>
          <table class="info-table">
            <tr><td>1km人口</td><td>${evaluation.population1km?.toLocaleString() || 'N/A'}</td></tr>
            <tr><td>3km人口</td><td>${evaluation.population3km?.toLocaleString() || 'N/A'}</td></tr>
            <tr><td>写字楼数量</td><td>${evaluation.officeBuildings || 'N/A'} 栋</td></tr>
            <tr><td>工位估算</td><td>${evaluation.estimatedWorkstations?.toLocaleString() || 'N/A'}</td></tr>
            <tr><td>停车位</td><td>${evaluation.parkingSpots || 'N/A'} 个</td></tr>
            <tr><td>主要年龄层</td><td>${evaluation.ageGroup || 'N/A'}</td></tr>
            <tr><td>消费能力</td><td>${evaluation.consumptionLevel || 'N/A'}</td></tr>
          </table>
        </div>
      </div>
      
      <div class="section">
        <h2>评分详情</h2>
        ${[
          { label: '客流量', score: evaluation.trafficScore },
          { label: '铺位条件', score: evaluation.locationScore },
          { label: '客群匹配', score: evaluation.customerMatchScore },
          { label: '区域热力', score: evaluation.heatScore },
          { label: '成本控制', score: evaluation.costScore },
          { label: '竞争环境', score: evaluation.competitionScore },
        ].map(item => {
          const score = Number(item.score) || 0;
          const percentage = (score / 10) * 100;
          let barColor = '#22c55e';
          if (percentage < 40) barColor = '#ef4444';
          else if (percentage < 60) barColor = '#f59e0b';
          else if (percentage < 80) barColor = '#3b82f6';
          
          return `
            <div class="score-item">
              <div class="label-row">
                <span style="color:#666;">${item.label}</span>
                <span style="color:#333;font-weight:bold;">${score}/10</span>
              </div>
              <div class="bar-bg">
                <div class="bar" style="background:${barColor};width:${percentage}%;"></div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
      
      ${evaluation.breakEvenRevenue || evaluation.breakEvenTurnover ? `
        <div class="section">
          <h2>财务分析</h2>
          <table class="info-table">
            <tr><td>日保本营业额</td><td>¥${evaluation.breakEvenRevenue ? parseFloat(evaluation.breakEvenRevenue.toString()).toLocaleString() : 'N/A'}</td></tr>
            <tr><td>日保本翻台率</td><td>${evaluation.breakEvenTurnover ? parseFloat(evaluation.breakEvenTurnover.toString()).toFixed(2) : 'N/A'} 次/天</td></tr>
            <tr><td>风险评估</td><td>${evaluation.financialRisk || '未评估'}</td></tr>
          </table>
        </div>
      ` : ''}
      
      ${aiAnalysisHtml}
      
      <div class="footer">
        餐厅选址评估系统 - 报告生成于 ${new Date().toLocaleString('zh-CN')}
      </div>
    </body>
    </html>
  `;
}

/**
 * 使用浏览器打印功能生成PDF（打开新窗口供用户打印/保存为PDF）
 */
export async function generatePDFInBrowser(data: EvaluationData): Promise<void> {
  const htmlContent = createPrintContent(data);
  
  // 创建一个隐藏的iframe来生成打印内容
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);
  
  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) {
    document.body.removeChild(iframe);
    throw new Error('无法创建打印文档');
  }
  
  iframeDoc.open();
  iframeDoc.write(htmlContent);
  iframeDoc.close();
  
  // 等待内容加载完成
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // 触发打印
  iframe.contentWindow?.print();
  
  // 打印完成后移除iframe
  setTimeout(() => {
    document.body.removeChild(iframe);
  }, 1000);
}
