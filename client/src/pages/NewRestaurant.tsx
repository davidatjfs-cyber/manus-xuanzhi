import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import { ArrowLeft, MapPin, Building2, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { 
  RESTAURANT_TYPES, 
  TARGET_CUSTOMERS, 
  RESTAURANT_SCALES, 
  BUSINESS_MODELS,
  RESTAURANT_SUB_CATEGORIES
} from "@shared/types";

export default function NewRestaurant() {
  const { loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    subCategory: '',
    priceRangeMin: '',
    priceRangeMax: '',
    targetCustomer: '',
    scale: '',
    businessModel: '',
  });

  // 获取当前餐厅类型的细分品类选项
  const subCategories = formData.type ? RESTAURANT_SUB_CATEGORIES[formData.type as keyof typeof RESTAURANT_SUB_CATEGORIES] || [] : [];

  const createMutation = trpc.restaurant.create.useMutation({
    onSuccess: (data) => {
      toast.success('餐厅创建成功');
      setLocation(`/evaluation/new/${data.id}`);
    },
    onError: (error) => {
      toast.error(`创建失败: ${error.message}`);
    },
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      window.location.href = getLoginUrl();
    }
  }, [loading, isAuthenticated]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.type || !formData.targetCustomer || !formData.scale || !formData.businessModel) {
      toast.error('请填写所有必填项');
      return;
    }

    const priceMin = parseInt(formData.priceRangeMin) || 0;
    const priceMax = parseInt(formData.priceRangeMax) || 0;

    if (priceMin > priceMax) {
      toast.error('最低客单价不能高于最高客单价');
      return;
    }

    createMutation.mutate({
      name: formData.name,
      type: formData.type,
      subCategory: formData.subCategory || undefined,
      priceRangeMin: priceMin,
      priceRangeMax: priceMax,
      targetCustomer: formData.targetCustomer,
      scale: formData.scale,
      businessModel: formData.businessModel,
    });
  };

  return (
    <div className="min-h-screen gradient-bg">
      {/* 导航栏 */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container py-4">
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
              <span className="font-semibold text-foreground">新建餐厅</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="container py-8 max-w-2xl">
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl gradient-accent flex items-center justify-center">
                <Building2 className="w-6 h-6 text-background" />
              </div>
              <div>
                <CardTitle className="text-foreground">创建餐厅项目</CardTitle>
                <CardDescription>填写餐厅基本信息，用于后续选址评估</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 餐厅名称 */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-foreground">餐厅名称 *</Label>
                <Input
                  id="name"
                  placeholder="例如：老王川菜馆"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="bg-input border-border"
                />
              </div>

              {/* 餐厅类型 */}
              <div className="space-y-2">
                <Label className="text-foreground">餐厅类型 *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, type: value, subCategory: '' }))}
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
              </div>

              {/* 细分品类 */}
              {subCategories.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-foreground">细分品类</Label>
                  <Select
                    value={formData.subCategory}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, subCategory: value }))}
                  >
                    <SelectTrigger className="bg-input border-border">
                      <SelectValue placeholder="选择细分品类（可选）" />
                    </SelectTrigger>
                    <SelectContent>
                      {subCategories.map(sub => (
                        <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* 客单价范围 */}
              <div className="space-y-2">
                <Label className="text-foreground">客单价范围（元）</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Input
                      type="number"
                      placeholder="最低"
                      value={formData.priceRangeMin}
                      onChange={(e) => setFormData(prev => ({ ...prev, priceRangeMin: e.target.value }))}
                      className="bg-input border-border"
                    />
                  </div>
                  <div>
                    <Input
                      type="number"
                      placeholder="最高"
                      value={formData.priceRangeMax}
                      onChange={(e) => setFormData(prev => ({ ...prev, priceRangeMax: e.target.value }))}
                      className="bg-input border-border"
                    />
                  </div>
                </div>
              </div>

              {/* 目标客群 */}
              <div className="space-y-2">
                <Label className="text-foreground">主要目标客群 *</Label>
                <Select
                  value={formData.targetCustomer}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, targetCustomer: value }))}
                >
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue placeholder="选择目标客群" />
                  </SelectTrigger>
                  <SelectContent>
                    {TARGET_CUSTOMERS.map(customer => (
                      <SelectItem key={customer} value={customer}>{customer}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 餐厅规模 */}
              <div className="space-y-2">
                <Label className="text-foreground">餐厅规模 *</Label>
                <Select
                  value={formData.scale}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, scale: value }))}
                >
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue placeholder="选择餐厅规模" />
                  </SelectTrigger>
                  <SelectContent>
                    {RESTAURANT_SCALES.map(scale => (
                      <SelectItem key={scale.value} value={scale.value}>{scale.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 经营模式 */}
              <div className="space-y-2">
                <Label className="text-foreground">经营模式 *</Label>
                <Select
                  value={formData.businessModel}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, businessModel: value }))}
                >
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue placeholder="选择经营模式" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUSINESS_MODELS.map(model => (
                      <SelectItem key={model.value} value={model.value}>
                        <div>
                          <div>{model.label}</div>
                          <div className="text-xs text-muted-foreground">{model.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.businessModel && (
                  <p className="text-sm text-muted-foreground">
                    {BUSINESS_MODELS.find(m => m.value === formData.businessModel)?.description}
                  </p>
                )}
              </div>

              {/* 提交按钮 */}
              <div className="flex gap-4 pt-4">
                <Link href="/dashboard" className="flex-1">
                  <Button type="button" variant="outline" className="w-full">
                    取消
                  </Button>
                </Link>
                <Button 
                  type="submit" 
                  className="flex-1 gradient-accent text-background"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      创建中...
                    </>
                  ) : (
                    '创建并开始评估'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
