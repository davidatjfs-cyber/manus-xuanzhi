import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import { 
  ArrowLeft, 
  MapPin, 
  Home,
  History,
  Calculator,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  XCircle,
  BarChart3
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
} from "recharts";

export default function Compare() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const { data: evaluations, isLoading } = trpc.evaluation.list.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const { data: restaurants } = trpc.restaurant.list.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      window.location.href = getLoginUrl();
    }
  }, [loading, isAuthenticated]);

  // 获取选中的评估数据
  const selectedEvaluations = useMemo(() => {
    if (!evaluations) return [];
    return evaluations.filter(e => selectedIds.includes(e.id));
  }, [evaluations, selectedIds]);

  // 获取餐厅名称
  const getRestaurantName = (restaurantId: number) => {
    const restaurant = restaurants?.find(r => r.id === restaurantId);
    return restaurant?.name || '未知餐厅';
  };

  // 切换选择
  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(i => i !== id);
      }
      if (prev.length >= 4) {
        return prev;
      }
      return [...prev, id];
    });
  };

  // 生成雷达图数据
  const radarData = useMemo(() => {
    if (selectedEvaluations.length === 0) return [];
    
    const dimensions = ['客流量', '铺位条件', '客群匹配', '区域热力', '成本控制', '竞争环境'];
    const keys = ['trafficScore', 'locationScore', 'customerMatchScore', 'heatScore', 'costScore', 'competitionScore'] as const;
    
    return dimensions.map((dimension, index) => {
      const data: Record<string, unknown> = { dimension };
      selectedEvaluations.forEach((evaluation, evalIndex) => {
        data[`评估${evalIndex + 1}`] = evaluation[keys[index]] || 0;
      });
      return data;
    });
  }, [selectedEvaluations]);

  // 颜色数组
  const colors = [
    'oklch(0.72 0.18 55)',
    'oklch(0.55 0.12 195)',
    'oklch(0.65 0.18 145)',
    'oklch(0.75 0.15 85)',
  ];

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const getScoreIcon = (score: number) => {
    if (score >= 75) return <CheckCircle className="w-4 h-4 text-[oklch(0.65_0.18_145)]" />;
    if (score >= 60) return <AlertTriangle className="w-4 h-4 text-[oklch(0.75_0.15_85)]" />;
    return <XCircle className="w-4 h-4 text-destructive" />;
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-[oklch(0.65_0.18_145)]';
    if (score >= 60) return 'text-[oklch(0.75_0.15_85)]';
    return 'text-destructive';
  };

  return (
    <div className="min-h-screen gradient-bg">
      {/* 导航栏 */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/">
                <div className="flex items-center gap-3 cursor-pointer">
                  <div className="w-10 h-10 rounded-xl gradient-accent flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-background" />
                  </div>
                  <span className="text-xl font-bold text-foreground">选址评估</span>
                </div>
              </Link>
              
              <div className="hidden md:flex items-center gap-1">
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                    <Home className="w-4 h-4 mr-2" />
                    控制台
                  </Button>
                </Link>
                <Link href="/history">
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                    <History className="w-4 h-4 mr-2" />
                    历史记录
                  </Button>
                </Link>
                <Link href="/calculator">
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                    <Calculator className="w-4 h-4 mr-2" />
                    财务计算
                  </Button>
                </Link>
              </div>
            </div>
            
            <span className="text-sm text-muted-foreground hidden sm:block">
              {user?.name || user?.email || '用户'}
            </span>
          </div>
        </div>
      </nav>

      <main className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">选址对比分析</h1>
          <p className="text-muted-foreground">
            选择最多4个评估记录进行对比分析
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* 左侧：选择列表 */}
          <Card className="bg-card border-border lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-foreground">选择评估记录</CardTitle>
              <CardDescription>
                已选择 {selectedIds.length}/4 个
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : evaluations && evaluations.length > 0 ? (
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {evaluations.map(evaluation => {
                    const score = Number(evaluation.totalScore) || 0;
                    const isSelected = selectedIds.includes(evaluation.id);
                    
                    return (
                      <div 
                        key={evaluation.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          isSelected 
                            ? 'bg-primary/10 border-primary' 
                            : 'bg-secondary/50 border-border hover:bg-secondary'
                        }`}
                        onClick={() => toggleSelect(evaluation.id)}
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox 
                            checked={isSelected}
                            disabled={!isSelected && selectedIds.length >= 4}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground text-sm truncate">
                              {evaluation.address}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {getRestaurantName(evaluation.restaurantId)}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            {getScoreIcon(score)}
                            <span className={`font-bold ${getScoreColor(score)}`}>
                              {score.toFixed(0)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">还没有评估记录</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 右侧：对比结果 */}
          <div className="lg:col-span-2 space-y-6">
            {selectedEvaluations.length >= 2 ? (
              <>
                {/* 雷达图对比 */}
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-foreground flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      维度对比
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[400px]">
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
                          {selectedEvaluations.map((_, index) => (
                            <Radar
                              key={index}
                              name={`评估${index + 1}`}
                              dataKey={`评估${index + 1}`}
                              stroke={colors[index]}
                              fill={colors[index]}
                              fillOpacity={0.2}
                              strokeWidth={2}
                            />
                          ))}
                          <Legend />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* 详细对比表格 */}
                <Card className="bg-card border-border overflow-hidden">
                  <CardHeader>
                    <CardTitle className="text-foreground">详细对比</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border bg-secondary/50">
                            <th className="text-left p-4 text-foreground font-medium">指标</th>
                            {selectedEvaluations.map((evaluation, index) => (
                              <th key={evaluation.id} className="text-center p-4 min-w-[150px]">
                                <div 
                                  className="inline-block w-3 h-3 rounded-full mr-2"
                                  style={{ backgroundColor: colors[index] }}
                                />
                                <span className="text-foreground font-medium">评估{index + 1}</span>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-border">
                            <td className="p-4 text-muted-foreground">地址</td>
                            {selectedEvaluations.map(e => (
                              <td key={e.id} className="p-4 text-center text-foreground text-sm">
                                {e.address.length > 20 ? e.address.slice(0, 20) + '...' : e.address}
                              </td>
                            ))}
                          </tr>
                          <tr className="border-b border-border">
                            <td className="p-4 text-muted-foreground">综合得分</td>
                            {selectedEvaluations.map(e => {
                              const score = Number(e.totalScore) || 0;
                              return (
                                <td key={e.id} className={`p-4 text-center font-bold text-xl ${getScoreColor(score)}`}>
                                  {score.toFixed(0)}
                                </td>
                              );
                            })}
                          </tr>
                          <tr className="border-b border-border">
                            <td className="p-4 text-muted-foreground">面积</td>
                            {selectedEvaluations.map(e => (
                              <td key={e.id} className="p-4 text-center text-foreground">
                                {e.area}㎡
                              </td>
                            ))}
                          </tr>
                          <tr className="border-b border-border">
                            <td className="p-4 text-muted-foreground">月租金</td>
                            {selectedEvaluations.map(e => (
                              <td key={e.id} className="p-4 text-center text-foreground">
                                ¥{e.monthlyRent?.toLocaleString()}
                              </td>
                            ))}
                          </tr>
                          <tr className="border-b border-border">
                            <td className="p-4 text-muted-foreground">租金单价</td>
                            {selectedEvaluations.map(e => (
                              <td key={e.id} className="p-4 text-center text-foreground">
                                ¥{((e.monthlyRent || 0) / (e.area || 1)).toFixed(0)}/㎡
                              </td>
                            ))}
                          </tr>
                          <tr className="border-b border-border">
                            <td className="p-4 text-muted-foreground">客流量评分</td>
                            {selectedEvaluations.map(e => (
                              <td key={e.id} className="p-4 text-center text-foreground">
                                {e.trafficScore}/10
                              </td>
                            ))}
                          </tr>
                          <tr className="border-b border-border">
                            <td className="p-4 text-muted-foreground">铺位条件评分</td>
                            {selectedEvaluations.map(e => (
                              <td key={e.id} className="p-4 text-center text-foreground">
                                {e.locationScore}/10
                              </td>
                            ))}
                          </tr>
                          <tr className="border-b border-border">
                            <td className="p-4 text-muted-foreground">客群匹配评分</td>
                            {selectedEvaluations.map(e => (
                              <td key={e.id} className="p-4 text-center text-foreground">
                                {e.customerMatchScore}/10
                              </td>
                            ))}
                          </tr>
                          <tr className="border-b border-border">
                            <td className="p-4 text-muted-foreground">区域热力评分</td>
                            {selectedEvaluations.map(e => (
                              <td key={e.id} className="p-4 text-center text-foreground">
                                {e.heatScore}/10
                              </td>
                            ))}
                          </tr>
                          <tr className="border-b border-border">
                            <td className="p-4 text-muted-foreground">成本控制评分</td>
                            {selectedEvaluations.map(e => (
                              <td key={e.id} className="p-4 text-center text-foreground">
                                {e.costScore}/10
                              </td>
                            ))}
                          </tr>
                          <tr>
                            <td className="p-4 text-muted-foreground">竞争环境评分</td>
                            {selectedEvaluations.map(e => (
                              <td key={e.id} className="p-4 text-center text-foreground">
                                {e.competitionScore}/10
                              </td>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {/* 推荐结论 */}
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-foreground">对比结论</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const sorted = [...selectedEvaluations].sort(
                        (a, b) => (Number(b.totalScore) || 0) - (Number(a.totalScore) || 0)
                      );
                      const best = sorted[0];
                      const bestScore = Number(best?.totalScore) || 0;
                      
                      return (
                        <div className="space-y-4">
                          <div className="p-4 rounded-lg bg-[oklch(0.65_0.18_145/0.1)] border border-[oklch(0.65_0.18_145/0.3)]">
                            <div className="flex items-center gap-3">
                              <CheckCircle className="w-6 h-6 text-[oklch(0.65_0.18_145)]" />
                              <div>
                                <h4 className="font-semibold text-foreground">推荐选址</h4>
                                <p className="text-sm text-muted-foreground">
                                  {best?.address} (综合得分: {bestScore.toFixed(0)}分)
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          <p className="text-muted-foreground text-sm">
                            在所选的 {selectedEvaluations.length} 个选址中，
                            「{best?.address.slice(0, 20)}...」综合评分最高，
                            {bestScore >= 75 
                              ? '各项指标表现优秀，建议优先考虑。' 
                              : bestScore >= 60 
                                ? '整体条件尚可，但仍需谨慎评估风险因素。'
                                : '但综合评分偏低，建议继续寻找更优选址。'}
                          </p>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="bg-card border-border">
                <CardContent className="p-12 text-center">
                  <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    选择评估记录进行对比
                  </h3>
                  <p className="text-muted-foreground">
                    从左侧列表中选择至少2个评估记录，即可查看对比分析结果
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
