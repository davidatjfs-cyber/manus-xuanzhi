import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import { 
  ArrowLeft, 
  MapPin, 
  Search,
  Filter,
  Trash2,
  Eye,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Home,
  History as HistoryIcon,
  Calculator
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function History() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterScore, setFilterScore] = useState<string>('all');

  const { data: evaluations, isLoading, refetch } = trpc.evaluation.list.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const { data: restaurants } = trpc.restaurant.list.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const deleteMutation = trpc.evaluation.delete.useMutation({
    onSuccess: () => {
      toast.success('评估记录已删除');
      refetch();
    },
    onError: (error) => {
      toast.error(`删除失败: ${error.message}`);
    },
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      window.location.href = getLoginUrl();
    }
  }, [loading, isAuthenticated]);

  // 过滤评估记录
  const filteredEvaluations = useMemo(() => {
    if (!evaluations) return [];
    
    return evaluations.filter(evaluation => {
      // 搜索过滤
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        if (!evaluation.address.toLowerCase().includes(searchLower)) {
          return false;
        }
      }
      
      // 评分过滤
      const score = Number(evaluation.totalScore) || 0;
      if (filterScore === 'recommended' && score < 75) return false;
      if (filterScore === 'cautious' && (score < 60 || score >= 75)) return false;
      if (filterScore === 'notRecommended' && score >= 60) return false;
      
      return true;
    });
  }, [evaluations, searchTerm, filterScore]);

  // 获取餐厅名称
  const getRestaurantName = (restaurantId: number) => {
    const restaurant = restaurants?.find(r => r.id === restaurantId);
    return restaurant?.name || '未知餐厅';
  };

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
    if (score >= 75) return <CheckCircle className="w-5 h-5 text-[oklch(0.65_0.18_145)]" />;
    if (score >= 60) return <AlertTriangle className="w-5 h-5 text-[oklch(0.75_0.15_85)]" />;
    return <XCircle className="w-5 h-5 text-destructive" />;
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
                  <Button variant="ghost" size="sm" className="text-foreground">
                    <HistoryIcon className="w-4 h-4 mr-2" />
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
            
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground hidden sm:block">
                {user?.name || user?.email || '用户'}
              </span>
            </div>
          </div>
        </div>
      </nav>

      <main className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">历史评估记录</h1>
          <p className="text-muted-foreground">
            查看和管理所有选址评估记录
          </p>
        </div>

        {/* 搜索和过滤 */}
        <Card className="bg-card border-border mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="搜索地址..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-input border-border"
                />
              </div>
              <Select value={filterScore} onValueChange={setFilterScore}>
                <SelectTrigger className="w-full sm:w-[180px] bg-input border-border">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="筛选评分" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部评估</SelectItem>
                  <SelectItem value="recommended">推荐 (≥75分)</SelectItem>
                  <SelectItem value="cautious">谨慎 (60-74分)</SelectItem>
                  <SelectItem value="notRecommended">不推荐 (&lt;60分)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* 评估列表 */}
        {isLoading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="bg-card border-border">
                <CardContent className="p-6">
                  <div className="h-20 bg-muted rounded-lg animate-pulse" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredEvaluations.length > 0 ? (
          <div className="grid gap-4">
            {filteredEvaluations.map(evaluation => {
              const score = Number(evaluation.totalScore) || 0;
              
              return (
                <Card key={evaluation.id} className="bg-card border-border card-hover">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        {getScoreIcon(score)}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground truncate">
                            {evaluation.address}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {getRestaurantName(evaluation.restaurantId)} · {evaluation.area}㎡ · ¥{evaluation.monthlyRent?.toLocaleString()}/月
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(evaluation.createdAt).toLocaleDateString('zh-CN', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className={`text-3xl font-bold ${getScoreColor(score)}`}>
                            {score.toFixed(0)}
                          </div>
                          <p className="text-xs text-muted-foreground">综合得分</p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Link href={`/evaluation/${evaluation.id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4 mr-1" />
                              查看
                            </Button>
                          </Link>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-card border-border">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-foreground">确认删除</AlertDialogTitle>
                                <AlertDialogDescription>
                                  确定要删除这条评估记录吗？此操作无法撤销。
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>取消</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteMutation.mutate({ id: evaluation.id })}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  删除
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="bg-card border-border">
            <CardContent className="p-12 text-center">
              <HistoryIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {searchTerm || filterScore !== 'all' ? '没有找到匹配的记录' : '还没有评估记录'}
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchTerm || filterScore !== 'all' 
                  ? '尝试调整搜索条件或筛选器' 
                  : '开始您的第一次选址评估吧'}
              </p>
              {!searchTerm && filterScore === 'all' && (
                <Link href="/evaluation/new">
                  <Button className="gradient-accent text-background">
                    开始评估
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        )}

        {/* 统计信息 */}
        {evaluations && evaluations.length > 0 && (
          <Card className="bg-card border-border mt-6">
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-foreground">{evaluations.length}</div>
                  <p className="text-sm text-muted-foreground">总评估数</p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-[oklch(0.65_0.18_145)]">
                    {evaluations.filter(e => Number(e.totalScore) >= 75).length}
                  </div>
                  <p className="text-sm text-muted-foreground">推荐选址</p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-[oklch(0.75_0.15_85)]">
                    {evaluations.filter(e => Number(e.totalScore) >= 60 && Number(e.totalScore) < 75).length}
                  </div>
                  <p className="text-sm text-muted-foreground">谨慎考虑</p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-destructive">
                    {evaluations.filter(e => Number(e.totalScore) < 60).length}
                  </div>
                  <p className="text-sm text-muted-foreground">不推荐</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
