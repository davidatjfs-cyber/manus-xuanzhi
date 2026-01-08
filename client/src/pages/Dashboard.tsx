import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import { 
  Plus, 
  MapPin, 
  History, 
  Calculator, 
  FileText,
  ChevronRight,
  Building2,
  TrendingUp,
  LogOut,
  Home
} from "lucide-react";


export default function Dashboard() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [, setLocation] = useLocation();
  
  const { data: restaurants, isLoading: restaurantsLoading } = trpc.restaurant.list.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  
  const { data: evaluations, isLoading: evaluationsLoading } = trpc.evaluation.list.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl gradient-accent flex items-center justify-center mx-auto mb-6">
            <MapPin className="w-8 h-8 text-background" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-4">请先登录</h1>
          <p className="text-muted-foreground mb-6">登录后即可使用选址评估功能</p>
          <a href={getLoginUrl()}>
            <Button className="gradient-accent text-background font-semibold">
              登录 / 注册
            </Button>
          </a>
          <div className="mt-4">
            <Link href="/">
              <Button variant="ghost" className="text-muted-foreground">
                返回首页
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const recentEvaluations = evaluations?.slice(0, 5) || [];
  const highScoreCount = evaluations?.filter(e => Number(e.totalScore) >= 75).length || 0;
  const cautionCount = evaluations?.filter(e => Number(e.totalScore) >= 60 && Number(e.totalScore) < 75).length || 0;

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
                  <Button variant="ghost" size="sm" className="text-foreground">
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
            
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground hidden sm:block">
                {user?.name || user?.email || '用户'}
              </span>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  logout();
                  setLocation('/');
                }}
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="container py-8">
        {/* 欢迎区域 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            欢迎回来，{user?.name || '用户'}
          </h1>
          <p className="text-muted-foreground">
            管理您的餐厅项目，创建新的选址评估
          </p>
        </div>

        {/* 快捷操作 */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Link href="/restaurant/new">
            <Card className="bg-card border-border card-hover cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl gradient-accent flex items-center justify-center group-hover:glow-orange transition-all">
                    <Plus className="w-6 h-6 text-background" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">新建餐厅</h3>
                    <p className="text-sm text-muted-foreground">创建餐厅项目</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/evaluation/new">
            <Card className="bg-card border-border card-hover cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[oklch(0.55_0.12_195)] flex items-center justify-center group-hover:glow-teal transition-all">
                    <MapPin className="w-6 h-6 text-background" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">选址评估</h3>
                    <p className="text-sm text-muted-foreground">开始新评估</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/calculator">
            <Card className="bg-card border-border card-hover cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[oklch(0.65_0.15_75)] flex items-center justify-center">
                    <Calculator className="w-6 h-6 text-background" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">财务计算</h3>
                    <p className="text-sm text-muted-foreground">盈亏平衡分析</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/compare">
            <Card className="bg-card border-border card-hover cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">对比分析</h3>
                    <p className="text-sm text-muted-foreground">多选址对比</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* 统计概览 */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">评估概览</CardTitle>
              <CardDescription>您的选址评估统计</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-primary" />
                    <span className="text-foreground">餐厅项目</span>
                  </div>
                  <span className="text-2xl font-bold text-foreground">
                    {restaurantsLoading ? '-' : restaurants?.length || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-[oklch(0.55_0.12_195)]" />
                    <span className="text-foreground">评估总数</span>
                  </div>
                  <span className="text-2xl font-bold text-foreground">
                    {evaluationsLoading ? '-' : evaluations?.length || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl bg-[oklch(0.65_0.18_145/0.1)] border border-[oklch(0.65_0.18_145/0.3)]">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 text-[oklch(0.65_0.18_145)]" />
                    <span className="text-foreground">推荐选址</span>
                  </div>
                  <span className="text-2xl font-bold text-[oklch(0.65_0.18_145)]">
                    {highScoreCount}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl bg-[oklch(0.75_0.15_85/0.1)] border border-[oklch(0.75_0.15_85/0.3)]">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-[oklch(0.75_0.15_85)]" />
                    <span className="text-foreground">谨慎考虑</span>
                  </div>
                  <span className="text-2xl font-bold text-[oklch(0.75_0.15_85)]">
                    {cautionCount}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 我的餐厅 */}
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-foreground">我的餐厅</CardTitle>
                <CardDescription>已创建的餐厅项目</CardDescription>
              </div>
              <Link href="/restaurant/new">
                <Button size="sm" variant="outline">
                  <Plus className="w-4 h-4 mr-1" />
                  新建
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {restaurantsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : restaurants && restaurants.length > 0 ? (
                <div className="space-y-3">
                  {restaurants.slice(0, 5).map(restaurant => (
                    <Link key={restaurant.id} href={`/evaluation/new/${restaurant.id}`}>
                      <div className="p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer group">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-foreground">{restaurant.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {restaurant.type} · {restaurant.businessModel}
                            </p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground mb-4">还没有餐厅项目</p>
                  <Link href="/restaurant/new">
                    <Button size="sm" className="gradient-accent text-background">
                      创建第一个餐厅
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 最近评估 */}
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-foreground">最近评估</CardTitle>
                <CardDescription>最新的选址评估记录</CardDescription>
              </div>
              <Link href="/history">
                <Button size="sm" variant="outline">
                  查看全部
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {evaluationsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : recentEvaluations.length > 0 ? (
                <div className="space-y-3">
                  {recentEvaluations.map(evaluation => {
                    const score = Number(evaluation.totalScore) || 0;
                    const scoreColor = score >= 75 
                      ? 'text-[oklch(0.65_0.18_145)]' 
                      : score >= 60 
                        ? 'text-[oklch(0.75_0.15_85)]' 
                        : 'text-destructive';
                    
                    return (
                      <Link key={evaluation.id} href={`/evaluation/${evaluation.id}`}>
                        <div className="p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer group">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground truncate">
                                {evaluation.address}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(evaluation.createdAt).toLocaleDateString('zh-CN')}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`text-xl font-bold ${scoreColor}`}>
                                {score.toFixed(0)}
                              </span>
                              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground mb-4">还没有评估记录</p>
                  <Link href="/evaluation/new">
                    <Button size="sm" className="gradient-accent text-background">
                      开始第一次评估
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
