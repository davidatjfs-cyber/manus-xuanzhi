import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Link, useSearch } from "wouter";
import { 
  ArrowLeft, 
  MapPin, 
  Calculator,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  DollarSign,
  Users,
  Home,
  History
} from "lucide-react";
import { useState, useEffect } from "react";
import { RESTAURANT_TYPES } from "@shared/types";

export default function FinancialCalculator() {
  const { user, isAuthenticated, logout } = useAuth();
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  
  const [formData, setFormData] = useState({
    estimatedPrice: '',
    grossMarginRate: '60',
    monthlyRent: params.get('rent') || '',
    monthlyLabor: '',
    otherCosts: '5000',
    seats: '',
    restaurantType: '中餐',
  });

  const [result, setResult] = useState<{
    dailyBreakEven: number;
    dailyTurnover: number;
    industryAvgTurnover: number;
    riskLevel: 'low' | 'medium' | 'high';
    riskDescription: string;
  } | null>(null);

  const calculateMutation = trpc.financial.quickCalculate.useMutation({
    onSuccess: (data) => {
      setResult(data);
    },
  });

  const handleCalculate = () => {
    if (!formData.estimatedPrice || !formData.monthlyRent || !formData.monthlyLabor || !formData.seats) {
      return;
    }

    calculateMutation.mutate({
      estimatedPrice: parseInt(formData.estimatedPrice),
      grossMarginRate: parseFloat(formData.grossMarginRate),
      monthlyRent: parseInt(formData.monthlyRent),
      monthlyLabor: parseInt(formData.monthlyLabor),
      otherCosts: parseInt(formData.otherCosts) || 0,
      seats: parseInt(formData.seats),
      restaurantType: formData.restaurantType,
    });
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-[oklch(0.65_0.18_145)]';
      case 'medium': return 'text-[oklch(0.75_0.15_85)]';
      case 'high': return 'text-destructive';
      default: return 'text-foreground';
    }
  };

  const getRiskBgColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-[oklch(0.65_0.18_145/0.1)] border-[oklch(0.65_0.18_145/0.3)]';
      case 'medium': return 'bg-[oklch(0.75_0.15_85/0.1)] border-[oklch(0.75_0.15_85/0.3)]';
      case 'high': return 'bg-destructive/10 border-destructive/30';
      default: return 'bg-card border-border';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'low': return <CheckCircle className="w-8 h-8 text-[oklch(0.65_0.18_145)]" />;
      case 'medium': return <AlertTriangle className="w-8 h-8 text-[oklch(0.75_0.15_85)]" />;
      case 'high': return <AlertTriangle className="w-8 h-8 text-destructive" />;
      default: return null;
    }
  };

  const getRiskLabel = (level: string) => {
    switch (level) {
      case 'low': return '低风险';
      case 'medium': return '中等风险';
      case 'high': return '高风险';
      default: return '';
    }
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
                  <Button variant="ghost" size="sm" className="text-foreground">
                    <Calculator className="w-4 h-4 mr-2" />
                    财务计算
                  </Button>
                </Link>
              </div>
            </div>
            
            {isAuthenticated && (
              <span className="text-sm text-muted-foreground hidden sm:block">
                {user?.name || user?.email || '用户'}
              </span>
            )}
          </div>
        </div>
      </nav>

      <main className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">盈亏平衡模拟器</h1>
          <p className="text-muted-foreground">
            计算保本营业额和翻台率，评估财务风险
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* 输入表单 */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Calculator className="w-5 h-5 text-primary" />
                财务参数
              </CardTitle>
              <CardDescription>输入餐厅运营的基本财务数据</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 餐厅类型 */}
              <div className="space-y-2">
                <Label className="text-foreground">餐厅类型</Label>
                <Select
                  value={formData.restaurantType}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, restaurantType: value }))}
                >
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue placeholder="选择餐厅类型" />
                  </SelectTrigger>
                  <SelectContent>
                    {RESTAURANT_TYPES.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  不同类型餐厅有不同的行业平均翻台率参考
                </p>
              </div>

              {/* 客单价 */}
              <div className="space-y-2">
                <Label className="text-foreground">预估客单价（元）*</Label>
                <Input
                  type="number"
                  placeholder="例如：80"
                  value={formData.estimatedPrice}
                  onChange={(e) => setFormData(prev => ({ ...prev, estimatedPrice: e.target.value }))}
                  className="bg-input border-border"
                />
              </div>

              {/* 毛利率 */}
              <div className="space-y-2">
                <Label className="text-foreground">预估毛利率（%）*</Label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  placeholder="例如：60"
                  value={formData.grossMarginRate}
                  onChange={(e) => setFormData(prev => ({ ...prev, grossMarginRate: e.target.value }))}
                  className="bg-input border-border"
                />
                <p className="text-xs text-muted-foreground">
                  餐饮行业毛利率通常在 50%-70% 之间
                </p>
              </div>

              {/* 座位数 */}
              <div className="space-y-2">
                <Label className="text-foreground">座位数 *</Label>
                <Input
                  type="number"
                  placeholder="例如：60"
                  value={formData.seats}
                  onChange={(e) => setFormData(prev => ({ ...prev, seats: e.target.value }))}
                  className="bg-input border-border"
                />
              </div>

              <div className="border-t border-border pt-6">
                <h4 className="font-medium text-foreground mb-4">月度固定成本</h4>
                
                {/* 月租金 */}
                <div className="space-y-2 mb-4">
                  <Label className="text-foreground">月租金（元）*</Label>
                  <Input
                    type="number"
                    placeholder="例如：30000"
                    value={formData.monthlyRent}
                    onChange={(e) => setFormData(prev => ({ ...prev, monthlyRent: e.target.value }))}
                    className="bg-input border-border"
                  />
                </div>

                {/* 人工成本 */}
                <div className="space-y-2 mb-4">
                  <Label className="text-foreground">月人工成本（元）*</Label>
                  <Input
                    type="number"
                    placeholder="例如：50000"
                    value={formData.monthlyLabor}
                    onChange={(e) => setFormData(prev => ({ ...prev, monthlyLabor: e.target.value }))}
                    className="bg-input border-border"
                  />
                </div>

                {/* 其他成本 */}
                <div className="space-y-2">
                  <Label className="text-foreground">其他月成本（元）</Label>
                  <Input
                    type="number"
                    placeholder="例如：5000"
                    value={formData.otherCosts}
                    onChange={(e) => setFormData(prev => ({ ...prev, otherCosts: e.target.value }))}
                    className="bg-input border-border"
                  />
                  <p className="text-xs text-muted-foreground">
                    包括水电、物业、杂费等
                  </p>
                </div>
              </div>

              <Button 
                onClick={handleCalculate}
                className="w-full gradient-accent text-background"
                disabled={!formData.estimatedPrice || !formData.monthlyRent || !formData.monthlyLabor || !formData.seats}
              >
                计算盈亏平衡点
              </Button>
            </CardContent>
          </Card>

          {/* 计算结果 */}
          <div className="space-y-6">
            {result ? (
              <>
                {/* 风险评估 */}
                <Card className={`border ${getRiskBgColor(result.riskLevel)}`}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      {getRiskIcon(result.riskLevel)}
                      <div>
                        <h3 className={`text-2xl font-bold ${getRiskColor(result.riskLevel)}`}>
                          {getRiskLabel(result.riskLevel)}
                        </h3>
                        <p className="text-muted-foreground">{result.riskDescription}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 关键指标 */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <Card className="bg-card border-border">
                    <CardContent className="p-6 text-center">
                      <DollarSign className="w-8 h-8 text-primary mx-auto mb-2" />
                      <div className="text-3xl font-bold text-foreground mb-1">
                        ¥{result.dailyBreakEven.toLocaleString()}
                      </div>
                      <p className="text-sm text-muted-foreground">日保本营业额</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-card border-border">
                    <CardContent className="p-6 text-center">
                      <Users className="w-8 h-8 text-[oklch(0.55_0.12_195)] mx-auto mb-2" />
                      <div className="text-3xl font-bold text-foreground mb-1">
                        {result.dailyTurnover.toFixed(1)}次
                      </div>
                      <p className="text-sm text-muted-foreground">日保本翻台率</p>
                    </CardContent>
                  </Card>
                </div>

                {/* 翻台率对比 */}
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-foreground flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-[oklch(0.65_0.15_75)]" />
                      翻台率分析
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-muted-foreground">保本翻台率</span>
                          <span className={`font-bold ${getRiskColor(result.riskLevel)}`}>
                            {result.dailyTurnover.toFixed(1)}次/天
                          </span>
                        </div>
                        <div className="h-3 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              result.riskLevel === 'low' ? 'bg-[oklch(0.65_0.18_145)]' :
                              result.riskLevel === 'medium' ? 'bg-[oklch(0.75_0.15_85)]' :
                              'bg-destructive'
                            }`}
                            style={{ width: `${Math.min(result.dailyTurnover / 6 * 100, 100)}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-muted-foreground">行业平均翻台率</span>
                          <span className="font-bold text-foreground">
                            {result.industryAvgTurnover}次/天
                          </span>
                        </div>
                        <div className="h-3 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-[oklch(0.55_0.12_195)] rounded-full"
                            style={{ width: `${Math.min(result.industryAvgTurnover / 6 * 100, 100)}%` }}
                          />
                        </div>
                      </div>

                      <div className="pt-4 border-t border-border">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">翻台率差距</span>
                          <span className={`font-bold ${
                            result.dailyTurnover <= result.industryAvgTurnover 
                              ? 'text-[oklch(0.65_0.18_145)]' 
                              : 'text-destructive'
                          }`}>
                            {result.dailyTurnover <= result.industryAvgTurnover ? '-' : '+'}
                            {Math.abs(result.dailyTurnover - result.industryAvgTurnover).toFixed(1)}次
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          {result.dailyTurnover <= result.industryAvgTurnover 
                            ? '保本翻台率低于行业平均，有较好的盈利空间'
                            : '保本翻台率高于行业平均，需要更高的运营效率才能盈利'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 详细计算 */}
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-foreground">计算明细</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">月固定成本</span>
                      <span className="text-foreground">
                        ¥{(parseInt(formData.monthlyRent) + parseInt(formData.monthlyLabor) + (parseInt(formData.otherCosts) || 0)).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">日固定成本</span>
                      <span className="text-foreground">
                        ¥{((parseInt(formData.monthlyRent) + parseInt(formData.monthlyLabor) + (parseInt(formData.otherCosts) || 0)) / 30).toFixed(0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">毛利率</span>
                      <span className="text-foreground">{formData.grossMarginRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">客单价</span>
                      <span className="text-foreground">¥{formData.estimatedPrice}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">座位数</span>
                      <span className="text-foreground">{formData.seats}座</span>
                    </div>
                    <div className="border-t border-border pt-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">日保本客流</span>
                        <span className="text-foreground font-medium">
                          {Math.ceil(result.dailyBreakEven / parseInt(formData.estimatedPrice))}人
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="bg-card border-border">
                <CardContent className="p-12 text-center">
                  <Calculator className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    输入参数开始计算
                  </h3>
                  <p className="text-muted-foreground">
                    填写左侧表单中的财务参数，点击计算按钮查看盈亏平衡分析结果
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
