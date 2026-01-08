import { useEffect } from 'react';
import { useParams } from 'wouter';
import { trpc } from '@/lib/trpc';

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

// 获取推荐等级颜色
function getRecommendationColor(recommendation: string | null): string {
  const text = getRecommendationText(recommendation);
  if (text === '强烈推荐') return '#22c55e';
  if (text === '推荐') return '#3b82f6';
  if (text === '谨慎考虑') return '#f59e0b';
  return '#ef4444';
}

export default function PrintReport() {
  const params = useParams<{ id: string }>();
  const evaluationId = parseInt(params.id || '0');

  const { data, isLoading, error } = trpc.evaluation.get.useQuery(
    { id: evaluationId },
    { enabled: evaluationId > 0 }
  );

  // 页面加载完成后自动触发打印
  useEffect(() => {
    if (data && !isLoading) {
      // 等待内容渲染完成后打印
      const timer = setTimeout(() => {
        window.print();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [data, isLoading]);

  if (isLoading) {
    return (
      <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'Microsoft YaHei, SimHei, sans-serif' }}>
        <p>正在加载报告数据...</p>
      </div>
    );
  }

  if (error || !data || !data.restaurant) {
    return (
      <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'Microsoft YaHei, SimHei, sans-serif' }}>
        <p>加载失败，请返回重试</p>
      </div>
    );
  }

  const { evaluation, restaurant } = data;
  const totalScore = parseFloat(evaluation.totalScore?.toString() || '0');
  const recommendationText = getRecommendationText(evaluation.recommendation);
  const recommendationColor = getRecommendationColor(evaluation.recommendation);

  // 处理AI分析内容
  const renderAIAnalysis = () => {
    if (!evaluation.llmAnalysis) return null;
    
    const content = evaluation.llmAnalysis
      .split('\n')
      .map((line: string, index: number) => {
        if (line.startsWith('### ')) {
          return <h4 key={index} style={{ color: '#1a1a2e', margin: '15px 0 8px 0', fontSize: '14px' }}>{line.replace('### ', '')}</h4>;
        }
        if (line.startsWith('## ')) {
          return <h3 key={index} style={{ color: '#1a1a2e', margin: '20px 0 10px 0', fontSize: '16px' }}>{line.replace('## ', '')}</h3>;
        }
        if (line.startsWith('# ')) {
          return <h2 key={index} style={{ color: '#1a1a2e', margin: '25px 0 12px 0', fontSize: '18px' }}>{line.replace('# ', '')}</h2>;
        }
        if (line.match(/^\d+\.\s+/)) {
          return <li key={index} style={{ margin: '5px 0' }}>{line.replace(/^\d+\.\s+/, '')}</li>;
        }
        if (line.startsWith('- ')) {
          return <li key={index} style={{ margin: '5px 0' }}>{line.replace('- ', '')}</li>;
        }
        if (line.trim()) {
          return <p key={index} style={{ margin: '8px 0', lineHeight: '1.6' }}>{line}</p>;
        }
        return null;
      });
    
    return (
      <div style={{ pageBreakBefore: 'always', padding: '20px 0' }}>
        <h2 style={{ color: '#1a1a2e', borderBottom: '2px solid #e5e5e5', paddingBottom: '10px', marginBottom: '20px', fontSize: '18px' }}>
          AI 智能分析报告
        </h2>
        <div style={{ fontSize: '12px', color: '#404040', lineHeight: '1.8' }}>
          {content}
        </div>
      </div>
    );
  };

  const scoreItems = [
    { label: '客流量', score: evaluation.trafficScore },
    { label: '铺位条件', score: evaluation.locationScore },
    { label: '客群匹配', score: evaluation.customerMatchScore },
    { label: '区域热力', score: evaluation.heatScore },
    { label: '成本控制', score: evaluation.costScore },
    { label: '竞争环境', score: evaluation.competitionScore },
  ];

  return (
    <>
      <style>{`
        @page { 
          size: A4; 
          margin: 15mm; 
        }
        @media print {
          body { 
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important;
          }
          .no-print { display: none !important; }
          .page-break { page-break-before: always; }
        }
        @media screen {
          .print-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: white;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
          }
        }
      `}</style>
      
      <div className="no-print" style={{ 
        background: '#f5f5f5', 
        padding: '15px', 
        textAlign: 'center',
        fontFamily: 'Microsoft YaHei, SimHei, sans-serif',
        borderBottom: '1px solid #ddd'
      }}>
        <p style={{ margin: '0 0 10px 0', color: '#666' }}>
          请使用浏览器的打印功能 (Ctrl+P / Cmd+P) 将此页面保存为PDF
        </p>
        <button 
          onClick={() => window.print()}
          style={{
            background: '#f97316',
            color: 'white',
            border: 'none',
            padding: '10px 25px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            marginRight: '10px'
          }}
        >
          打印/保存为PDF
        </button>
        <button 
          onClick={() => window.close()}
          style={{
            background: '#6b7280',
            color: 'white',
            border: 'none',
            padding: '10px 25px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          关闭
        </button>
      </div>

      <div className="print-container" style={{ 
        fontFamily: 'Microsoft YaHei, SimHei, PingFang SC, sans-serif',
        padding: '20px',
        color: '#333',
        background: 'white',
        fontSize: '12px',
        lineHeight: '1.6'
      }}>
        {/* 封面/头部 */}
        <div style={{ textAlign: 'center', padding: '30px 0', borderBottom: '2px solid #e5e5e5', marginBottom: '25px' }}>
          <h1 style={{ fontSize: '22px', color: '#1a1a2e', margin: '0 0 8px 0' }}>餐饮选址评估报告</h1>
          <p style={{ fontSize: '13px', color: '#666', marginBottom: '25px' }}>{evaluation.address}</p>
          <div style={{ 
            display: 'inline-block', 
            background: recommendationColor, 
            borderRadius: '10px', 
            padding: '15px 35px', 
            textAlign: 'center', 
            marginBottom: '15px' 
          }}>
            <div style={{ fontSize: '42px', color: 'white', fontWeight: 'bold' }}>{totalScore.toFixed(1)}</div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.9)', marginTop: '3px' }}>综合得分</div>
          </div>
          <div style={{ fontSize: '18px', color: recommendationColor, fontWeight: 'bold', marginBottom: '15px' }}>
            {recommendationText}
          </div>
          <p style={{ color: '#999', fontSize: '10px' }}>生成时间：{new Date().toLocaleString('zh-CN')}</p>
        </div>

        {/* 两列布局：餐厅信息 + 选址信息 */}
        <div style={{ display: 'flex', gap: '25px', marginBottom: '20px' }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ color: '#1a1a2e', borderBottom: '2px solid #e5e5e5', paddingBottom: '6px', marginBottom: '12px', fontSize: '15px' }}>
              餐厅项目信息
            </h2>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr><td style={{ padding: '6px 0', borderBottom: '1px solid #f0f0f0', color: '#666', width: '100px', fontSize: '11px' }}>餐厅名称</td><td style={{ padding: '6px 0', borderBottom: '1px solid #f0f0f0', fontSize: '11px' }}>{restaurant.name}</td></tr>
                <tr><td style={{ padding: '6px 0', borderBottom: '1px solid #f0f0f0', color: '#666', fontSize: '11px' }}>餐厅类型</td><td style={{ padding: '6px 0', borderBottom: '1px solid #f0f0f0', fontSize: '11px' }}>{restaurant.type}</td></tr>
                <tr><td style={{ padding: '6px 0', borderBottom: '1px solid #f0f0f0', color: '#666', fontSize: '11px' }}>客单价范围</td><td style={{ padding: '6px 0', borderBottom: '1px solid #f0f0f0', fontSize: '11px' }}>¥{restaurant.priceRangeMin}-{restaurant.priceRangeMax}</td></tr>
                <tr><td style={{ padding: '6px 0', borderBottom: '1px solid #f0f0f0', color: '#666', fontSize: '11px' }}>目标客群</td><td style={{ padding: '6px 0', borderBottom: '1px solid #f0f0f0', fontSize: '11px' }}>{restaurant.targetCustomer}</td></tr>
                <tr><td style={{ padding: '6px 0', borderBottom: '1px solid #f0f0f0', color: '#666', fontSize: '11px' }}>餐厅规模</td><td style={{ padding: '6px 0', borderBottom: '1px solid #f0f0f0', fontSize: '11px' }}>{restaurant.scale}</td></tr>
                <tr><td style={{ padding: '6px 0', borderBottom: '1px solid #f0f0f0', color: '#666', fontSize: '11px' }}>经营模式</td><td style={{ padding: '6px 0', borderBottom: '1px solid #f0f0f0', fontSize: '11px' }}>{restaurant.businessModel}</td></tr>
              </tbody>
            </table>
          </div>
          
          <div style={{ flex: 1 }}>
            <h2 style={{ color: '#1a1a2e', borderBottom: '2px solid #e5e5e5', paddingBottom: '6px', marginBottom: '12px', fontSize: '15px' }}>
              选址基本信息
            </h2>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr><td style={{ padding: '6px 0', borderBottom: '1px solid #f0f0f0', color: '#666', width: '100px', fontSize: '11px' }}>地址</td><td style={{ padding: '6px 0', borderBottom: '1px solid #f0f0f0', fontSize: '11px' }}>{evaluation.address}</td></tr>
                <tr><td style={{ padding: '6px 0', borderBottom: '1px solid #f0f0f0', color: '#666', fontSize: '11px' }}>铺位面积</td><td style={{ padding: '6px 0', borderBottom: '1px solid #f0f0f0', fontSize: '11px' }}>{evaluation.area} ㎡</td></tr>
                <tr><td style={{ padding: '6px 0', borderBottom: '1px solid #f0f0f0', color: '#666', fontSize: '11px' }}>月租金</td><td style={{ padding: '6px 0', borderBottom: '1px solid #f0f0f0', fontSize: '11px' }}>¥{evaluation.monthlyRent.toLocaleString()}</td></tr>
                <tr><td style={{ padding: '6px 0', borderBottom: '1px solid #f0f0f0', color: '#666', fontSize: '11px' }}>租金单价</td><td style={{ padding: '6px 0', borderBottom: '1px solid #f0f0f0', fontSize: '11px' }}>¥{(evaluation.monthlyRent / evaluation.area).toFixed(0)}/㎡</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 两列布局：铺位条件 + 周边环境 */}
        <div style={{ display: 'flex', gap: '25px', marginBottom: '20px' }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ color: '#1a1a2e', borderBottom: '2px solid #e5e5e5', paddingBottom: '6px', marginBottom: '12px', fontSize: '15px' }}>
              铺位条件
            </h2>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr><td style={{ padding: '6px 0', borderBottom: '1px solid #f0f0f0', color: '#666', width: '100px', fontSize: '11px' }}>主通道位置</td><td style={{ padding: '6px 0', borderBottom: '1px solid #f0f0f0', fontSize: '11px' }}>{evaluation.isMainCorridor ? '是' : '否'}</td></tr>
                <tr><td style={{ padding: '6px 0', borderBottom: '1px solid #f0f0f0', color: '#666', fontSize: '11px' }}>门头宽度</td><td style={{ padding: '6px 0', borderBottom: '1px solid #f0f0f0', fontSize: '11px' }}>{evaluation.storefrontWidth || 'N/A'} 米</td></tr>
                <tr><td style={{ padding: '6px 0', borderBottom: '1px solid #f0f0f0', color: '#666', fontSize: '11px' }}>需上台阶</td><td style={{ padding: '6px 0', borderBottom: '1px solid #f0f0f0', fontSize: '11px' }}>{evaluation.hasStairs ? '是' : '否'}</td></tr>
                <tr><td style={{ padding: '6px 0', borderBottom: '1px solid #f0f0f0', color: '#666', fontSize: '11px' }}>进深巷</td><td style={{ padding: '6px 0', borderBottom: '1px solid #f0f0f0', fontSize: '11px' }}>{evaluation.hasDeepAlley ? '是' : '否'}</td></tr>
              </tbody>
            </table>
          </div>
          
          <div style={{ flex: 1 }}>
            <h2 style={{ color: '#1a1a2e', borderBottom: '2px solid #e5e5e5', paddingBottom: '6px', marginBottom: '12px', fontSize: '15px' }}>
              周边环境
            </h2>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr><td style={{ padding: '6px 0', borderBottom: '1px solid #f0f0f0', color: '#666', width: '100px', fontSize: '11px' }}>1km人口</td><td style={{ padding: '6px 0', borderBottom: '1px solid #f0f0f0', fontSize: '11px' }}>{evaluation.population1km?.toLocaleString() || 'N/A'}</td></tr>
                <tr><td style={{ padding: '6px 0', borderBottom: '1px solid #f0f0f0', color: '#666', fontSize: '11px' }}>3km人口</td><td style={{ padding: '6px 0', borderBottom: '1px solid #f0f0f0', fontSize: '11px' }}>{evaluation.population3km?.toLocaleString() || 'N/A'}</td></tr>
                <tr><td style={{ padding: '6px 0', borderBottom: '1px solid #f0f0f0', color: '#666', fontSize: '11px' }}>写字楼数量</td><td style={{ padding: '6px 0', borderBottom: '1px solid #f0f0f0', fontSize: '11px' }}>{evaluation.officeBuildings || 'N/A'} 栋</td></tr>
                <tr><td style={{ padding: '6px 0', borderBottom: '1px solid #f0f0f0', color: '#666', fontSize: '11px' }}>工位估算</td><td style={{ padding: '6px 0', borderBottom: '1px solid #f0f0f0', fontSize: '11px' }}>{evaluation.estimatedWorkstations?.toLocaleString() || 'N/A'}</td></tr>
                <tr><td style={{ padding: '6px 0', borderBottom: '1px solid #f0f0f0', color: '#666', fontSize: '11px' }}>停车位</td><td style={{ padding: '6px 0', borderBottom: '1px solid #f0f0f0', fontSize: '11px' }}>{evaluation.parkingSpots || 'N/A'} 个</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 评分详情 */}
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ color: '#1a1a2e', borderBottom: '2px solid #e5e5e5', paddingBottom: '6px', marginBottom: '12px', fontSize: '15px' }}>
            评分详情
          </h2>
          {scoreItems.map((item, index) => {
            const score = Number(item.score) || 0;
            const percentage = (score / 10) * 100;
            let barColor = '#22c55e';
            if (percentage < 40) barColor = '#ef4444';
            else if (percentage < 60) barColor = '#f59e0b';
            else if (percentage < 80) barColor = '#3b82f6';
            
            return (
              <div key={index} style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '11px' }}>
                  <span style={{ color: '#666' }}>{item.label}</span>
                  <span style={{ color: '#333', fontWeight: 'bold' }}>{score}/10</span>
                </div>
                <div style={{ background: '#e5e5e5', borderRadius: '3px', height: '6px', overflow: 'hidden' }}>
                  <div style={{ background: barColor, width: `${percentage}%`, height: '100%', borderRadius: '3px' }}></div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 财务分析 */}
        {(evaluation.breakEvenRevenue || evaluation.breakEvenTurnover) && (
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ color: '#1a1a2e', borderBottom: '2px solid #e5e5e5', paddingBottom: '6px', marginBottom: '12px', fontSize: '15px' }}>
              财务分析
            </h2>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr><td style={{ padding: '6px 0', borderBottom: '1px solid #f0f0f0', color: '#666', width: '120px', fontSize: '11px' }}>日保本营业额</td><td style={{ padding: '6px 0', borderBottom: '1px solid #f0f0f0', fontSize: '11px' }}>¥{evaluation.breakEvenRevenue ? parseFloat(evaluation.breakEvenRevenue.toString()).toLocaleString() : 'N/A'}</td></tr>
                <tr><td style={{ padding: '6px 0', borderBottom: '1px solid #f0f0f0', color: '#666', fontSize: '11px' }}>日保本翻台率</td><td style={{ padding: '6px 0', borderBottom: '1px solid #f0f0f0', fontSize: '11px' }}>{evaluation.breakEvenTurnover ? parseFloat(evaluation.breakEvenTurnover.toString()).toFixed(2) : 'N/A'} 次/天</td></tr>
                <tr><td style={{ padding: '6px 0', borderBottom: '1px solid #f0f0f0', color: '#666', fontSize: '11px' }}>风险评估</td><td style={{ padding: '6px 0', borderBottom: '1px solid #f0f0f0', fontSize: '11px' }}>{evaluation.financialRisk || '未评估'}</td></tr>
              </tbody>
            </table>
          </div>
        )}

        {/* AI分析报告 */}
        {renderAIAnalysis()}

        {/* 页脚 */}
        <div style={{ textAlign: 'center', padding: '15px', color: '#999', fontSize: '10px', borderTop: '1px solid #e5e5e5', marginTop: '25px' }}>
          餐厅选址评估系统 - 报告生成于 {new Date().toLocaleString('zh-CN')}
        </div>
      </div>
    </>
  );
}
