import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";
import { 
  MapPin, 
  TrendingUp, 
  Calculator, 
  FileText, 
  ChevronRight,
  Sparkles,
  Target,
  BarChart3
} from "lucide-react";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen gradient-bg relative overflow-hidden">
      {/* 几何装饰元素 */}
      <div className="absolute top-20 left-10 w-32 h-32 border-2 border-[oklch(0.55_0.12_195/0.2)] rounded-lg rotate-12 animate-float" />
      <div className="absolute top-40 right-20 w-24 h-24 border-2 border-[oklch(0.72_0.18_55/0.2)] rounded-full animate-float" style={{ animationDelay: '2s' }} />
      <div className="absolute bottom-40 left-1/4 w-16 h-16 border-2 border-[oklch(0.55_0.12_195/0.15)] rounded-lg -rotate-12 animate-float" style={{ animationDelay: '4s' }} />
      <div className="absolute bottom-20 right-1/3 w-20 h-20 border-2 border-[oklch(0.72_0.18_55/0.15)] rounded-full animate-float" style={{ animationDelay: '1s' }} />
      
      {/* 导航栏 */}
      <nav className="relative z-10 container py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-accent flex items-center justify-center glow-orange">
              <MapPin className="w-5 h-5 text-background" />
            </div>
            <span className="text-xl font-bold text-foreground">选址评估</span>
          </div>
          
          <div className="flex items-center gap-4">
            {loading ? (
              <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
            ) : isAuthenticated ? (
              <div className="flex items-center gap-4">
                <span className="text-muted-foreground">欢迎, {user?.name || '用户'}</span>
                <Link href="/dashboard">
                  <Button className="gradient-accent text-background font-semibold">
                    进入控制台
                  </Button>
                </Link>
              </div>
            ) : (
              <a href={getLoginUrl()}>
                <Button className="gradient-accent text-background font-semibold">
                  登录 / 注册
                </Button>
              </a>
            )}
          </div>
        </div>
      </nav>

      {/* 主要内容区 */}
      <main className="relative z-10 container pt-16 pb-24">
        {/* Hero 区域 */}
        <div className="text-center max-w-4xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-border mb-8">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">AI 驱动的智能选址分析</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black text-foreground mb-6 leading-tight">
            年年有喜
            <span className="text-gradient block">餐饮选址智能评估系统</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            基于多维度数据分析与 AI 智能匹配，帮助餐厅经营者科学决策开店位置，
            降低选址风险，提升开店成功率。
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button size="lg" className="gradient-accent text-background font-bold text-lg px-8 py-6 glow-orange">
                  开始评估
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            ) : (
              <a href={getLoginUrl()}>
                <Button size="lg" className="gradient-accent text-background font-bold text-lg px-8 py-6 glow-orange">
                  免费开始
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </a>
            )}
            <Link href="/calculator">
              <Button size="lg" variant="outline" className="font-semibold text-lg px-8 py-6 border-border hover:bg-secondary">
                盈亏计算器
                <Calculator className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>

        {/* 功能特性 */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {[
            {
              icon: Target,
              title: "精准评分",
              description: "六大维度综合评估，科学量化选址质量",
              color: "text-primary"
            },
            {
              icon: BarChart3,
              title: "智能算法",
              description: "快餐/正餐差异化权重，匹配不同业态需求",
              color: "text-[oklch(0.55_0.12_195)]"
            },
            {
              icon: Calculator,
              title: "财务测算",
              description: "盈亏平衡分析，预警高风险选址",
              color: "text-[oklch(0.65_0.15_75)]"
            },
            {
              icon: FileText,
              title: "AI 报告",
              description: "LLM 生成专业分析报告，优劣势一目了然",
              color: "text-primary"
            }
          ].map((feature, index) => (
            <div 
              key={index}
              className="group p-6 rounded-2xl bg-card border border-border card-hover"
            >
              <div className={`w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mb-4 ${feature.color}`}>
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* 评分维度展示 */}
        <div className="glass rounded-3xl p-8 md:p-12">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-foreground mb-4">六大评估维度</h2>
            <p className="text-muted-foreground">全方位分析选址潜力，每项 1-10 分精细评估</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { name: "客流量", desc: "周边人流量、商圈活跃度、各时段客流分布", score: 8 },
              { name: "铺位条件", desc: "主通道位置、门头昭示性、可达性评估", score: 7 },
              { name: "客群匹配", desc: "目标客群与周边人群画像匹配度分析", score: 9 },
              { name: "区域热力", desc: "商业热度、发展潜力、周边配套成熟度", score: 6 },
              { name: "成本控制", desc: "租金水平、装修成本、运营成本评估", score: 8 },
              { name: "竞争环境", desc: "周边竞品分析、差异化空间、市场饱和度", score: 7 }
            ].map((dimension, index) => (
              <div key={index} className="p-5 rounded-xl bg-secondary/50 border border-border">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-foreground">{dimension.name}</span>
                  <span className="text-2xl font-black text-primary">{dimension.score}</span>
                </div>
                <p className="text-sm text-muted-foreground">{dimension.desc}</p>
                <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full gradient-accent rounded-full transition-all duration-500"
                    style={{ width: `${dimension.score * 10}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 底部 CTA */}
        <div className="text-center mt-20">
          <h2 className="text-3xl font-bold text-foreground mb-4">准备好开始了吗？</h2>
          <p className="text-muted-foreground mb-8">立即体验智能选址评估，让数据驱动您的开店决策</p>
          {isAuthenticated ? (
            <Link href="/dashboard">
              <Button size="lg" className="gradient-accent text-background font-bold text-lg px-10 py-6 glow-orange">
                进入控制台
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          ) : (
            <a href={getLoginUrl()}>
              <Button size="lg" className="gradient-accent text-background font-bold text-lg px-10 py-6 glow-orange">
                免费注册开始
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </a>
          )}
        </div>
      </main>

      {/* 页脚 */}
      <footer className="relative z-10 border-t border-border py-8">
        <div className="container text-center text-sm text-muted-foreground">
          <p>© 2025 餐饮选址智能评估系统. 数据驱动决策，科学选址开店。</p>
        </div>
      </footer>
    </div>
  );
}
