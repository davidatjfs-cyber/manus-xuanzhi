import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Link, useParams, useLocation } from "wouter";
import { 
  ArrowLeft, 
  MapPin, 
  Loader2, 
  Download, 
  Sparkles,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Building2,
  Users,
  TrendingUp,
  DollarSign
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
// PDF导出改为打开打印预览页面
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

export default function EvaluationResult() {
  const { loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const evaluationId = parseInt(params.id || '0');

  const { data, isLoading, refetch } = trpc.evaluation.get.useQuery(
    { id: evaluationId },
    { enabled: isAuthenticated && evaluationId > 0 }
  );

  const generateAnalysisMutation = trpc.analysis.generate.useMutation({
    onSuccess: () => {
      toast.success('AI分析报告生成成功');
      refetch();
    },
    onError: (error) => {
      toast.error(`生成失败: ${error.message}`);
    },
  });

  const handleExportPDF = () => {
    // 打开打印预览页面
    window.open(`/print/${evaluationId}`, '_blank');
  };

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      window.location.href = getLoginUrl();
    }
  }, [loading, isAuthenticated]);

  if (loading || isLoading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !data) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <Card className="bg-card border-border max-w-md">
          <CardContent className="p-8 text-center">
            <XCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">评估不存在</h2>
            <p className="text-muted-foreground mb-4">未找到该评估记录</p>
            <Link href="/dashboard">
              <Button>返回控制台</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { evaluation, restaurant } = data;
  const totalScore = Number(evaluation.totalScore) || 0;
  
  // 评分颜色
  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-[oklch(0.65_0.18_145)]';
    if (score >= 60) return 'text-[oklch(0.75_0.15_85)]';
    return 'text-destructive';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 75) return 'bg-[oklch(0.65_0.18_145/0.1)] border-[oklch(0.65_0.18_145/0.3)]';
    if (score >= 60) return 'bg-[oklch(0.75_0.15_85/0.1)] border-[oklch(0.75_0.15_85/0.3)]';
    return 'bg-destructive/10 border-destructive/30';
  };

  const getRecommendationIcon = () => {
    if (totalScore >= 75) return <CheckCircle className="w-8 h-8 text-[oklch(0.65_0.18_145)]" />;
    if (totalScore >= 60) return <AlertTriangle className="w-8 h-8 text-[oklch(0.75_0.15_85)]" />;
    return <XCircle className="w-8 h-8 text-destructive" />;
  };

  const getRecommendationText = () => {
    if (totalScore >= 85) return { title: '强烈推荐', desc: '该选址各项指标优秀，建议优先考虑' };
    if (totalScore >= 75) return { title: '推荐', desc: '综合条件良好，可以考虑' };
    if (totalScore >= 60) return { title: '谨慎考虑', desc: '存在一定风险因素，需要综合评估' };
    return { title: '建议放弃', desc: '综合评分较低，建议寻找其他位置' };
  };

  // 雷达图数据
  const radarData = [
    { dimension: '客流量', score: evaluation.trafficScore || 0, fullMark: 10 },
    { dimension: '铺位条件', score: evaluation.locationScore || 0, fullMark: 10 },
    { dimension: '客群匹配', score: evaluation.customerMatchScore || 0, fullMark: 10 },
    { dimension: '区域热力', score: evaluation.heatScore || 0, fullMark: 10 },
    { dimension: '成本控制', score: evaluation.costScore || 0, fullMark: 10 },
    { dimension: '竞争环境', score: evaluation.competitionScore || 0, fullMark: 10 },
  ];

  const recommendation = getRecommendationText();

  return (
    <div className="min-h-screen gradient-bg">
      {/* 导航栏 */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  返回
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg gradient-accent flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-background" />
                </div>
                <span className="font-semibold text-foreground">评估报告</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPDF}
              >
                <Download className="w-4 h-4 mr-2" />
                导出PDF
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="container py-8">
        {/* 综合得分卡片 */}
        <Card className={`bg-card border ${getScoreBgColor(totalScore)} mb-8`}>
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex items-center gap-6">
                {getRecommendationIcon()}
                <div>
                  <h1 className="text-2xl font-bold text-foreground mb-1">{recommendation.title}</h1>
                  <p className="text-muted-foreground">{recommendation.desc}</p>
                </div>
              </div>
              <div className="text-center">
                <div className={`score-display ${getScoreColor(totalScore)}`}>
                  {totalScore.toFixed(0)}
                </div>
                <p className="text-muted-foreground mt-2">综合得分</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* 左侧：基本信息 */}
          <div className="space-y-6">
            {/* 餐厅信息 */}
            {restaurant && (
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-primary" />
                    餐厅信息
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">餐厅名称</span>
                    <span className="text-foreground font-medium">{restaurant.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">餐厅类型</span>
                    <span className="text-foreground">{restaurant.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">经营模式</span>
                    <span className="text-foreground">{restaurant.businessModel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">客单价</span>
                    <span className="text-foreground">¥{restaurant.priceRangeMin}-{restaurant.priceRangeMax}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">目标客群</span>
                    <span className="text-foreground">{restaurant.targetCustomer}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 选址信息 */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[oklch(0.55_0.12_195)]" />
                  选址信息
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="text-muted-foreground text-sm">地址</span>
                  <p className="text-foreground">{evaluation.address}</p>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">铺位面积</span>
                  <span className="text-foreground">{evaluation.area} ㎡</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">月租金</span>
                  <span className="text-foreground">¥{evaluation.monthlyRent?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">租金单价</span>
                  <span className="text-foreground">¥{((evaluation.monthlyRent || 0) / (evaluation.area || 1)).toFixed(0)}/㎡</span>
                </div>
                {evaluation.storefrontWidth && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">门头宽度</span>
                    <span className="text-foreground">{evaluation.storefrontWidth}米</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">主通道位置</span>
                  <span className={evaluation.isMainCorridor ? 'text-[oklch(0.65_0.18_145)]' : 'text-muted-foreground'}>
                    {evaluation.isMainCorridor ? '是' : '否'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">需上台阶</span>
                  <span className={evaluation.hasStairs ? 'text-destructive' : 'text-[oklch(0.65_0.18_145)]'}>
                    {evaluation.hasStairs ? '是' : '否'}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* 周边环境 */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Users className="w-5 h-5 text-[oklch(0.65_0.15_75)]" />
                  周边环境
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {evaluation.population1km && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">1km人口</span>
                    <span className="text-foreground">{evaluation.population1km?.toLocaleString()}</span>
                  </div>
                )}
                {evaluation.population3km && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">3km人口</span>
                    <span className="text-foreground">{evaluation.population3km?.toLocaleString()}</span>
                  </div>
                )}
                {evaluation.officeBuildings && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">写字楼</span>
                    <span className="text-foreground">{evaluation.officeBuildings}栋</span>
                  </div>
                )}
                {evaluation.estimatedWorkstations && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">工位估算</span>
                    <span className="text-foreground">{evaluation.estimatedWorkstations?.toLocaleString()}</span>
                  </div>
                )}
                {evaluation.parkingSpots && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">停车位</span>
                    <span className="text-foreground">{evaluation.parkingSpots}个</span>
                  </div>
                )}
                {evaluation.ageGroup && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">主要年龄层</span>
                    <span className="text-foreground">{evaluation.ageGroup}</span>
                  </div>
                )}
                {evaluation.consumptionLevel && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">消费能力</span>
                    <span className="text-foreground">{evaluation.consumptionLevel}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 中间：雷达图和评分详情 */}
          <div className="space-y-6">
            {/* 雷达图 */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  维度分析
                </CardTitle>
                <CardDescription>六大维度评分雷达图</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="oklch(0.25 0.04 220)" />
                      <PolarAngleAxis 
                        dataKey="dimension" 
                        tick={{ fill: 'oklch(0.60 0.02 220)', fontSize: 12 }}
                      />
                      <PolarRadiusAxis 
                        angle={30} 
                        domain={[0, 10]} 
                        tick={{ fill: 'oklch(0.60 0.02 220)' }}
                      />
                      <Radar
                        name="评分"
                        dataKey="score"
                        stroke="oklch(0.72 0.18 55)"
                        fill="oklch(0.72 0.18 55)"
                        fillOpacity={0.3}
                        strokeWidth={2}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* 评分详情 */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">评分详情</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {radarData.map((item, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-foreground">{item.dimension}</span>
                      <span className={`text-xl font-bold ${item.score >= 7 ? 'text-[oklch(0.65_0.18_145)]' : item.score >= 5 ? 'text-[oklch(0.75_0.15_85)]' : 'text-destructive'}`}>
                        {item.score}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full gradient-accent rounded-full transition-all duration-500"
                        style={{ width: `${item.score * 10}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* 财务计算入口 */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-[oklch(0.65_0.15_75)]" />
                  财务测算
                </CardTitle>
                <CardDescription>计算盈亏平衡点</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href={`/calculator?evaluationId=${evaluationId}&rent=${evaluation.monthlyRent}`}>
                  <Button className="w-full gradient-accent text-background">
                    进行财务测算
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* 右侧：AI分析报告 */}
          <div className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  AI 智能分析
                </CardTitle>
                <CardDescription>基于 LLM 生成的专业选址建议</CardDescription>
              </CardHeader>
              <CardContent>
                {evaluation.llmAnalysis ? (
                  <div className="prose prose-invert prose-sm max-w-none">
                    <Streamdown>{evaluation.llmAnalysis}</Streamdown>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">
                      尚未生成 AI 分析报告
                    </p>
                    <Button
                      onClick={() => generateAnalysisMutation.mutate({ evaluationId })}
                      disabled={generateAnalysisMutation.isPending}
                      className="gradient-accent text-background"
                    >
                      {generateAnalysisMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          生成中...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          生成 AI 分析
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 周边餐厅市调 */}
            {(evaluation.brandAName || evaluation.brandBName || evaluation.brandCName) && (
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">周边餐厅市调</CardTitle>
                  <CardDescription>竞争情况与上座率调研</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* 上座率对比图表 */}
                  {(() => {
                    // 准备图表数据
                    const chartData = [
                      {
                        name: '周一午市',
                        ...(evaluation.brandAName && { [evaluation.brandAName]: evaluation.brandAMonLunch ?? 0 }),
                        ...(evaluation.brandBName && { [evaluation.brandBName]: evaluation.brandBMonLunch ?? 0 }),
                        ...(evaluation.brandCName && { [evaluation.brandCName]: evaluation.brandCMonLunch ?? 0 }),
                      },
                      {
                        name: '周一晚市',
                        ...(evaluation.brandAName && { [evaluation.brandAName]: evaluation.brandAMonDinner ?? 0 }),
                        ...(evaluation.brandBName && { [evaluation.brandBName]: evaluation.brandBMonDinner ?? 0 }),
                        ...(evaluation.brandCName && { [evaluation.brandCName]: evaluation.brandCMonDinner ?? 0 }),
                      },
                      {
                        name: '周五午市',
                        ...(evaluation.brandAName && { [evaluation.brandAName]: evaluation.brandAFriLunch ?? 0 }),
                        ...(evaluation.brandBName && { [evaluation.brandBName]: evaluation.brandBFriLunch ?? 0 }),
                        ...(evaluation.brandCName && { [evaluation.brandCName]: evaluation.brandCFriLunch ?? 0 }),
                      },
                      {
                        name: '周五晚市',
                        ...(evaluation.brandAName && { [evaluation.brandAName]: evaluation.brandAFriDinner ?? 0 }),
                        ...(evaluation.brandBName && { [evaluation.brandBName]: evaluation.brandBFriDinner ?? 0 }),
                        ...(evaluation.brandCName && { [evaluation.brandCName]: evaluation.brandCFriDinner ?? 0 }),
                      },
                      {
                        name: '周六午市',
                        ...(evaluation.brandAName && { [evaluation.brandAName]: evaluation.brandASatLunch ?? 0 }),
                        ...(evaluation.brandBName && { [evaluation.brandBName]: evaluation.brandBSatLunch ?? 0 }),
                        ...(evaluation.brandCName && { [evaluation.brandCName]: evaluation.brandCSatLunch ?? 0 }),
                      },
                      {
                        name: '周六晚市',
                        ...(evaluation.brandAName && { [evaluation.brandAName]: evaluation.brandASatDinner ?? 0 }),
                        ...(evaluation.brandBName && { [evaluation.brandBName]: evaluation.brandBSatDinner ?? 0 }),
                        ...(evaluation.brandCName && { [evaluation.brandCName]: evaluation.brandCSatDinner ?? 0 }),
                      },
                    ];

                    // 检查是否有有效数据
                    const hasData = chartData.some(item => 
                      Object.keys(item).filter(k => k !== 'name').some(k => {
                        const val = (item as Record<string, number | string>)[k];
                        return typeof val === 'number' && val > 0;
                      })
                    );

                    if (!hasData) return null;

                    return (
                      <div className="mb-6">
                        <h4 className="text-sm font-medium text-muted-foreground mb-3">上座率对比图表</h4>
                        <div className="h-[280px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0.04 220)" />
                              <XAxis 
                                dataKey="name" 
                                tick={{ fill: 'oklch(0.60 0.02 220)', fontSize: 11 }}
                                axisLine={{ stroke: 'oklch(0.30 0.04 220)' }}
                              />
                              <YAxis 
                                tick={{ fill: 'oklch(0.60 0.02 220)', fontSize: 11 }}
                                axisLine={{ stroke: 'oklch(0.30 0.04 220)' }}
                                domain={[0, 100]}
                                tickFormatter={(value) => `${value}%`}
                              />
                              <Tooltip 
                                contentStyle={{ 
                                  backgroundColor: 'oklch(0.18 0.02 220)', 
                                  border: '1px solid oklch(0.30 0.04 220)',
                                  borderRadius: '8px',
                                  color: 'oklch(0.90 0.02 220)'
                                }}
                                formatter={(value: number) => [`${value}%`, '']}
                              />
                              <Legend 
                                wrapperStyle={{ paddingTop: '10px' }}
                                formatter={(value) => <span style={{ color: 'oklch(0.70 0.02 220)' }}>{value}</span>}
                              />
                              {evaluation.brandAName && (
                                <Bar 
                                  dataKey={evaluation.brandAName} 
                                  fill="oklch(0.55 0.12 195)" 
                                  radius={[4, 4, 0, 0]}
                                />
                              )}
                              {evaluation.brandBName && (
                                <Bar 
                                  dataKey={evaluation.brandBName} 
                                  fill="oklch(0.65 0.15 55)" 
                                  radius={[4, 4, 0, 0]}
                                />
                              )}
                              {evaluation.brandCName && (
                                <Bar 
                                  dataKey={evaluation.brandCName} 
                                  fill="oklch(0.60 0.10 280)" 
                                  radius={[4, 4, 0, 0]}
                                />
                              )}
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    );
                  })()}
                  {/* 同品类餐厅 */}
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">同品类餐厅：</span>
                    <span className={evaluation.hasSameCategory ? "text-orange-400" : "text-green-400"}>
                      {evaluation.hasSameCategory ? "有" : "无"}
                    </span>
                  </div>

                  {/* 品牌A市调数据 */}
                  {evaluation.brandAName && (
                    <div className="space-y-3 p-4 rounded-lg bg-muted/30 border border-border">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[oklch(0.55_0.12_195)] flex items-center justify-center text-background font-bold text-xs">A</div>
                        <span className="font-medium text-foreground">{evaluation.brandAName}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground mb-1">周一</p>
                          <p className="text-foreground">午: {evaluation.brandAMonLunch ?? '-'}% / 晚: {evaluation.brandAMonDinner ?? '-'}%</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1">周五</p>
                          <p className="text-foreground">午: {evaluation.brandAFriLunch ?? '-'}% / 晚: {evaluation.brandAFriDinner ?? '-'}%</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1">周六</p>
                          <p className="text-foreground">午: {evaluation.brandASatLunch ?? '-'}% / 晚: {evaluation.brandASatDinner ?? '-'}%</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 品牌B市调数据 */}
                  {evaluation.brandBName && (
                    <div className="space-y-3 p-4 rounded-lg bg-muted/30 border border-border">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[oklch(0.65_0.15_55)] flex items-center justify-center text-background font-bold text-xs">B</div>
                        <span className="font-medium text-foreground">{evaluation.brandBName}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground mb-1">周一</p>
                          <p className="text-foreground">午: {evaluation.brandBMonLunch ?? '-'}% / 晚: {evaluation.brandBMonDinner ?? '-'}%</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1">周五</p>
                          <p className="text-foreground">午: {evaluation.brandBFriLunch ?? '-'}% / 晚: {evaluation.brandBFriDinner ?? '-'}%</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1">周六</p>
                          <p className="text-foreground">午: {evaluation.brandBSatLunch ?? '-'}% / 晚: {evaluation.brandBSatDinner ?? '-'}%</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 品牌C市调数据 */}
                  {evaluation.brandCName && (
                    <div className="space-y-3 p-4 rounded-lg bg-muted/30 border border-border">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[oklch(0.60_0.10_280)] flex items-center justify-center text-background font-bold text-xs">C</div>
                        <span className="font-medium text-foreground">{evaluation.brandCName}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground mb-1">周一</p>
                          <p className="text-foreground">午: {evaluation.brandCMonLunch ?? '-'}% / 晚: {evaluation.brandCMonDinner ?? '-'}%</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1">周五</p>
                          <p className="text-foreground">午: {evaluation.brandCFriLunch ?? '-'}% / 晚: {evaluation.brandCFriDinner ?? '-'}%</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1">周六</p>
                          <p className="text-foreground">午: {evaluation.brandCSatLunch ?? '-'}% / 晚: {evaluation.brandCSatDinner ?? '-'}%</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* 周边环境描述 */}
            {evaluation.surroundingDesc && (
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">环境描述</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {evaluation.surroundingDesc}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
