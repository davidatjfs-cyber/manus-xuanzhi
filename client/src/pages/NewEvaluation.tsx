import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Link, useLocation, useParams } from "wouter";
import { 
  ArrowLeft, MapPin, Loader2, Search, Sparkles, Database, ClipboardList, Calculator,
  Building2, ShoppingBag, Film, Train, Bus, GraduationCap, Hospital, AlertTriangle,
  TrendingUp, Users, DollarSign, Eye, Navigation, Wrench, Store, Info
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { 
  AGE_GROUPS, CONSUMPTION_LEVELS, SCORE_DIMENSIONS, VISIBILITY_OPTIONS, FLOOR_LEVELS,
  RESTAURANT_SUB_CATEGORIES, RESTAURANT_TYPES
} from "@shared/types";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { MapView } from "@/components/Map";

// 步骤定义
const STEPS = [
  { id: 'data-center', label: '数据中心', icon: Database, description: '系统自动获取区域数据' },
  { id: 'survey', label: '现场勘察', icon: ClipboardList, description: '手动填写实地调研数据' },
  { id: 'financial', label: '财务测算', icon: Calculator, description: '盈亏平衡与回本分析' },
];

export default function NewEvaluationV2() {
  const { loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const params = useParams<{ restaurantId?: string }>();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>(params.restaurantId || '');
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  
  const { data: restaurants } = trpc.restaurant.list.useQuery(undefined, { enabled: isAuthenticated });
  const selectedRestaurant = restaurants?.find(r => r.id.toString() === selectedRestaurantId);
  
  // 数据中心分析结果
  const [dataCenterResult, setDataCenterResult] = useState<any>(null);
  
  // 表单数据
  const [formData, setFormData] = useState({
    // 基本信息
    address: '',
    mallName: '',
    latitude: '',
    longitude: '',
    area: '',
    monthlyRent: '',
    
    // ========== 数据中心（系统自动） ==========
    // 热力图数据
    trafficHeatmap: null as any,
    weeklyTraffic: null as any,
    avgRentPerSqm: '',
    avgHousePrice: '',
    consumptionIndex: '',
    // POI数据
    poi500mOffices: '',
    poi500mMalls: '',
    poi500mCinemas: '',
    poi500mSubways: '',
    poi500mBusStops: '',
    poi500mSchools: '',
    poi500mHospitals: '',
    // 周边设施
    nearbyPremiumOffices: [] as any[],
    nearbyResidentialAreas: [] as any[],
    nearbyMalls: [] as any[],
    // 竞对分析（手动输入）
    manualCompetitors: [
      { name: '', category: '', distance: '', priceRange: '' },
      { name: '', category: '', distance: '', priceRange: '' },
      { name: '', category: '', distance: '', priceRange: '' },
      { name: '', category: '', distance: '', priceRange: '' },
      { name: '', category: '', distance: '', priceRange: '' },
    ] as Array<{ name: string; category: string; distance: string; priceRange: string }>,
    sameCategoryCount: '',
    competitionSaturationIndex: '',
    isRedOcean: false,
    
    // ========== 现场勘察（手动填写） ==========
    // 铺位情况 - 可视性
    visibility: '',
    isBlocked: false,
    blockingDesc: '',
    // 铺位情况 - 通达性
    floorLevel: '',
    isMainDiningFloor: false,
    nearEscalator: false,
    isMiddleOfFloor: false,
    nearPopularBrand: false,
    nearPopularBrandName: '',
    // 铺位情况 - 房型缺陷
    hasShapeDefect: false,
    shapeDefectDesc: '',
    // 铺位情况 - 工程条件
    hasEngineeringDefect: false,
    engineeringDefectDesc: '',
    // 原有铺位字段
    isMainCorridor: false,
    storefrontWidth: '',
    hasStairs: false,
    hasDeepAlley: false,
    
    // 客流量市调（3个品牌）
    brandAName: '',
    brandAPriceRange: '',
    brandAMonLunch: '', brandAMonDinner: '',
    brandAFriLunch: '', brandAFriDinner: '',
    brandASatLunch: '', brandASatDinner: '',
    brandBName: '',
    brandBPriceRange: '',
    brandBMonLunch: '', brandBMonDinner: '',
    brandBFriLunch: '', brandBFriDinner: '',
    brandBSatLunch: '', brandBSatDinner: '',
    brandCName: '',
    brandCPriceRange: '',
    brandCMonLunch: '', brandCMonDinner: '',
    brandCFriLunch: '', brandCFriDinner: '',
    brandCSatLunch: '', brandCSatDinner: '',
    
    // 商场品牌业绩参考（3个品牌）
    refBrand1Name: '',
    refBrand1Category: '',
    refBrand1MonthlyRevenue: '',
    refBrand1DailyTurnover: '',
    refBrand1Remark: '',
    refBrand2Name: '',
    refBrand2Category: '',
    refBrand2MonthlyRevenue: '',
    refBrand2DailyTurnover: '',
    refBrand2Remark: '',
    refBrand3Name: '',
    refBrand3Category: '',
    refBrand3MonthlyRevenue: '',
    refBrand3DailyTurnover: '',
    refBrand3Remark: '',
    
    // 周边环境
    surroundingDesc: '',
    population1km: '',
    population3km: '',
    officeBuildings: '',
    estimatedWorkstations: '',
    parkingSpots: '',
    ageGroup: '',
    consumptionLevel: '',
    
    // ========== 评分 ==========
    trafficScore: 5,
    locationScore: 5,
    customerMatchScore: 5,
    heatScore: 0, // 系统自动
    costScore: 5,
    competitionScore: 5,
    
    // ========== 财务测算 ==========
    estimatedPrice: '', // 预估客单价
    grossMarginRate: '', // 毛利率
    monthlyLabor: '', // 月人工成本
    otherCosts: '', // 其他月成本
    seats: '', // 座位数
    estimatedMonthlyRevenue: '', // 预计月营收
    estimatedInvestment: '', // 预计总投资
    decorationCost: '', // 装修费用
    equipmentCost: '', // 设备费用
    initialInventory: '', // 首批物料
    deposit: '', // 押金
    otherInvestment: '', // 其他投资
  });

  const createMutation = trpc.evaluation.create.useMutation({
    onSuccess: (data) => {
      toast.success('评估创建成功');
      setLocation(`/evaluation/${data.id}`);
    },
    onError: (error) => {
      toast.error(`创建失败: ${error.message}`);
    },
  });

  const dataCenterAnalyze = trpc.dataCenter.analyze.useMutation();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      window.location.href = getLoginUrl();
    }
  }, [loading, isAuthenticated]);

  useEffect(() => {
    if (params.restaurantId) {
      setSelectedRestaurantId(params.restaurantId);
    }
  }, [params.restaurantId]);

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

  // 更新地图标记
  const updateMarker = (lat: number, lng: number) => {
    if (!mapRef.current) return;
    if (markerRef.current) {
      markerRef.current.map = null;
    }
    markerRef.current = new google.maps.marker.AdvancedMarkerElement({
      map: mapRef.current,
      position: { lat, lng },
      title: '选址位置',
    });
  };

  // 地址搜索
  const handleAddressSearch = () => {
    if (!formData.address.trim() || !mapRef.current) {
      toast.error('请输入要搜索的地址');
      return;
    }
    
    setIsSearching(true);
    const geocoder = new google.maps.Geocoder();
    
    geocoder.geocode({ address: formData.address }, (results, status) => {
      setIsSearching(false);
      if (status === 'OK' && results && results[0]) {
        const location = results[0].geometry.location;
        const lat = location.lat();
        const lng = location.lng();
        
        setFormData(prev => ({
          ...prev,
          address: results[0].formatted_address,
          latitude: lat.toFixed(7),
          longitude: lng.toFixed(7),
        }));
        
        setMapCenter({ lat, lng });
        mapRef.current?.setCenter({ lat, lng });
        mapRef.current?.setZoom(16);
        updateMarker(lat, lng);
        toast.success('地址定位成功');
      } else {
        toast.error('未找到该地址，请尝试更详细的地址');
      }
    });
  };

  // 数据中心自动分析
  const handleDataCenterAnalyze = async () => {
    if (!formData.address || !selectedRestaurant) {
      toast.error('请先选择餐厅并输入地址');
      return;
    }
    
    setIsAnalyzing(true);
    try {
      const result = await dataCenterAnalyze.mutateAsync({
        address: formData.address,
        latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
        longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
        restaurantType: selectedRestaurant.type,
        subCategory: selectedRestaurant.subCategory || undefined,
        mallName: formData.mallName || undefined,
      });
      
      setDataCenterResult(result);
      
      // 更新表单数据
      setFormData(prev => ({
        ...prev,
        trafficHeatmap: result.trafficHeatmap,
        weeklyTraffic: result.weeklyTraffic,
        avgRentPerSqm: result.avgRentPerSqm?.toString() || '',
        avgHousePrice: result.avgHousePrice?.toString() || '',
        consumptionIndex: result.consumptionIndex?.toString() || '',
        poi500mOffices: result.poi500m?.offices?.toString() || '',
        poi500mMalls: result.poi500m?.malls?.toString() || '',
        poi500mCinemas: result.poi500m?.cinemas?.toString() || '',
        poi500mSubways: result.poi500m?.subways?.toString() || '',
        poi500mBusStops: result.poi500m?.busStops?.toString() || '',
        poi500mSchools: result.poi500m?.schools?.toString() || '',
        poi500mHospitals: result.poi500m?.hospitals?.toString() || '',
        nearbyPremiumOffices: result.nearbyPremiumOffices || [],
        nearbyResidentialAreas: result.nearbyResidentialAreas || [],
        nearbyMalls: result.nearbyMalls || [],
        competitorList: result.competitors || [],
        sameCategoryCount: result.sameCategoryCount?.toString() || '',
        competitionSaturationIndex: result.competitionSaturationIndex?.toString() || '',
        isRedOcean: result.isRedOcean || false,
        heatScore: result.heatScore || 5,
        surroundingDesc: result.reasoning || '',
      }));
      
      toast.success('数据中心分析完成');
    } catch (error) {
      console.error('数据中心分析失败:', error);
      toast.error('数据中心分析失败，请稍后重试');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 计算财务指标
  const calculateFinancials = () => {
    const monthlyRent = parseInt(formData.monthlyRent) || 0;
    const monthlyLabor = parseInt(formData.monthlyLabor) || 0;
    const otherCosts = parseInt(formData.otherCosts) || 0;
    const grossMarginRate = parseFloat(formData.grossMarginRate) || 0;
    const estimatedPrice = parseInt(formData.estimatedPrice) || 0;
    const seats = parseInt(formData.seats) || 0;
    const estimatedMonthlyRevenue = parseInt(formData.estimatedMonthlyRevenue) || 0;
    const estimatedInvestment = parseInt(formData.estimatedInvestment) || 
      (parseInt(formData.decorationCost) || 0) + 
      (parseInt(formData.equipmentCost) || 0) + 
      (parseInt(formData.initialInventory) || 0) + 
      (parseInt(formData.deposit) || 0) + 
      (parseInt(formData.otherInvestment) || 0);
    
    // 月固定成本
    const monthlyFixedCosts = monthlyRent + monthlyLabor + otherCosts;
    
    // 保本月营业额 = 月固定成本 / 毛利率
    const breakEvenRevenue = grossMarginRate > 0 ? monthlyFixedCosts / (grossMarginRate / 100) : 0;
    
    // 保本日营业额
    const dailyBreakEven = breakEvenRevenue / 30;
    
    // 保本翻台率 = 日保本营业额 / (有效座位数 * 客单价)
    // 实际满座率按70%计算（餐位数 × 70% = 1轮有效客流）
    const effectiveSeats = seats * 0.7;
    const dailyTurnover = (effectiveSeats > 0 && estimatedPrice > 0) 
      ? dailyBreakEven / (effectiveSeats * estimatedPrice) 
      : 0;
    
    // 月利润 = 月营收 * 毛利率 - 月固定成本
    const monthlyProfit = estimatedMonthlyRevenue * (grossMarginRate / 100) - monthlyFixedCosts;
    
    // 回本周期（月）
    const paybackPeriod = (monthlyProfit > 0 && estimatedInvestment > 0) 
      ? Math.ceil(estimatedInvestment / monthlyProfit) 
      : 0;
    
    // 年投资回报率
    const annualROI = estimatedInvestment > 0 
      ? ((monthlyProfit * 12) / estimatedInvestment) * 100 
      : 0;
    
    return {
      monthlyFixedCosts,
      breakEvenRevenue,
      dailyBreakEven,
      dailyTurnover,
      monthlyProfit,
      paybackPeriod,
      annualROI,
      estimatedInvestment,
    };
  };

  const financials = calculateFinancials();

  const handleMapReady = (map: google.maps.Map) => {
    mapRef.current = map;
    map.addListener('click', (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        setFormData(prev => ({
          ...prev,
          latitude: lat.toFixed(7),
          longitude: lng.toFixed(7),
        }));
        setMapCenter({ lat, lng });
        updateMarker(lat, lng);
        
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
          if (status === 'OK' && results && results[0]) {
            setFormData(prev => ({ ...prev, address: results[0].formatted_address }));
          }
        });
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedRestaurantId) {
      toast.error('请选择餐厅项目');
      return;
    }

    if (!formData.address || !formData.area || !formData.monthlyRent) {
      toast.error('请填写必填项：地址、面积、租金');
      return;
    }

    createMutation.mutate({
      restaurantId: parseInt(selectedRestaurantId),
      address: formData.address,
      latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
      longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
      area: parseInt(formData.area),
      monthlyRent: parseInt(formData.monthlyRent),
      // 周边餐厅市调数据
      hasSameCategory: formData.isRedOcean,
      brandAName: formData.brandAName || undefined,
      brandAMonLunch: formData.brandAMonLunch ? parseInt(formData.brandAMonLunch) : undefined,
      brandAMonDinner: formData.brandAMonDinner ? parseInt(formData.brandAMonDinner) : undefined,
      brandAFriLunch: formData.brandAFriLunch ? parseInt(formData.brandAFriLunch) : undefined,
      brandAFriDinner: formData.brandAFriDinner ? parseInt(formData.brandAFriDinner) : undefined,
      brandASatLunch: formData.brandASatLunch ? parseInt(formData.brandASatLunch) : undefined,
      brandASatDinner: formData.brandASatDinner ? parseInt(formData.brandASatDinner) : undefined,
      brandBName: formData.brandBName || undefined,
      brandBMonLunch: formData.brandBMonLunch ? parseInt(formData.brandBMonLunch) : undefined,
      brandBMonDinner: formData.brandBMonDinner ? parseInt(formData.brandBMonDinner) : undefined,
      brandBFriLunch: formData.brandBFriLunch ? parseInt(formData.brandBFriLunch) : undefined,
      brandBFriDinner: formData.brandBFriDinner ? parseInt(formData.brandBFriDinner) : undefined,
      brandBSatLunch: formData.brandBSatLunch ? parseInt(formData.brandBSatLunch) : undefined,
      brandBSatDinner: formData.brandBSatDinner ? parseInt(formData.brandBSatDinner) : undefined,
      brandCName: formData.brandCName || undefined,
      brandCMonLunch: formData.brandCMonLunch ? parseInt(formData.brandCMonLunch) : undefined,
      brandCMonDinner: formData.brandCMonDinner ? parseInt(formData.brandCMonDinner) : undefined,
      brandCFriLunch: formData.brandCFriLunch ? parseInt(formData.brandCFriLunch) : undefined,
      brandCFriDinner: formData.brandCFriDinner ? parseInt(formData.brandCFriDinner) : undefined,
      brandCSatLunch: formData.brandCSatLunch ? parseInt(formData.brandCSatLunch) : undefined,
      brandCSatDinner: formData.brandCSatDinner ? parseInt(formData.brandCSatDinner) : undefined,
      isMainCorridor: formData.isMainCorridor,
      storefrontWidth: formData.storefrontWidth ? parseFloat(formData.storefrontWidth) : undefined,
      hasStairs: formData.hasStairs,
      hasDeepAlley: formData.hasDeepAlley,
      surroundingDesc: formData.surroundingDesc || undefined,
      population1km: formData.population1km ? parseInt(formData.population1km) : undefined,
      population3km: formData.population3km ? parseInt(formData.population3km) : undefined,
      officeBuildings: formData.officeBuildings ? parseInt(formData.officeBuildings) : undefined,
      estimatedWorkstations: formData.estimatedWorkstations ? parseInt(formData.estimatedWorkstations) : undefined,
      parkingSpots: formData.parkingSpots ? parseInt(formData.parkingSpots) : undefined,
      ageGroup: formData.ageGroup || undefined,
      consumptionLevel: formData.consumptionLevel || undefined,
      trafficScore: formData.trafficScore,
      locationScore: formData.locationScore,
      customerMatchScore: formData.customerMatchScore,
      heatScore: formData.heatScore,
      costScore: formData.costScore,
      competitionScore: formData.competitionScore,
      // 竞对分析数据（手动输入）
      manualCompetitors: formData.manualCompetitors.filter(c => c.name),
      sameCategoryCount: formData.sameCategoryCount ? parseInt(formData.sameCategoryCount) : undefined,
      competitionSaturationIndex: formData.competitionSaturationIndex ? parseInt(formData.competitionSaturationIndex) : undefined,
      isRedOcean: formData.isRedOcean,
    });
  };

  // 渲染步骤指示器
  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-6">
      {STEPS.map((step, index) => {
        const Icon = step.icon;
        const isActive = index === currentStep;
        const isCompleted = index < currentStep;
        
        return (
          <div key={step.id} className="flex items-center">
            <button
              type="button"
              onClick={() => setCurrentStep(index)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                isActive 
                  ? 'bg-primary text-primary-foreground' 
                  : isCompleted 
                    ? 'bg-primary/20 text-primary' 
                    : 'bg-muted text-muted-foreground'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="font-medium">{step.label}</span>
            </button>
            {index < STEPS.length - 1 && (
              <div className={`w-8 h-0.5 mx-2 ${index < currentStep ? 'bg-primary' : 'bg-muted'}`} />
            )}
          </div>
        );
      })}
    </div>
  );

  // 渲染数据中心模块
  const renderDataCenter = () => (
    <div className="space-y-6">
      {/* 基本信息卡片 */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            选址基本信息
          </CardTitle>
          <CardDescription>填写商铺/商场地址，系统将自动分析区域数据</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 餐厅选择 */}
          <div className="space-y-2">
            <Label className="text-foreground">选择餐厅项目 *</Label>
            <Select value={selectedRestaurantId} onValueChange={setSelectedRestaurantId}>
              <SelectTrigger className="bg-input border-border">
                <SelectValue placeholder="选择餐厅项目" />
              </SelectTrigger>
              <SelectContent>
                {restaurants?.map(restaurant => (
                  <SelectItem key={restaurant.id} value={restaurant.id.toString()}>
                    {restaurant.name} ({restaurant.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* 地址输入 */}
          <div className="space-y-2">
            <Label className="text-foreground">商铺/商场地址 *</Label>
            <div className="flex gap-2">
              <Input
                placeholder="输入详细地址后按回车搜索"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddressSearch())}
                className="bg-input border-border flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddressSearch}
                disabled={isSearching}
              >
                {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          
          {/* 商场名称 */}
          <div className="space-y-2">
            <Label className="text-foreground">商场/商铺名称</Label>
            <Input
              placeholder="例如：万象城、大悦城"
              value={formData.mallName}
              onChange={(e) => setFormData(prev => ({ ...prev, mallName: e.target.value }))}
              className="bg-input border-border"
            />
          </div>
          
          {/* 面积和租金 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-foreground">铺位面积（㎡）*</Label>
              <Input
                type="number"
                placeholder="例如：100"
                value={formData.area}
                onChange={(e) => setFormData(prev => ({ ...prev, area: e.target.value }))}
                className="bg-input border-border"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">月租金（元）*</Label>
              <Input
                type="number"
                placeholder="例如：30000"
                value={formData.monthlyRent}
                onChange={(e) => setFormData(prev => ({ ...prev, monthlyRent: e.target.value }))}
                className="bg-input border-border"
              />
            </div>
          </div>
          
          {/* 地图 */}
          <div className="h-[300px] rounded-lg overflow-hidden border border-border">
            <MapView
              onMapReady={handleMapReady}
              initialCenter={mapCenter || { lat: 31.2304, lng: 121.4737 }}
              initialZoom={14}
            />
          </div>
          
          {/* 自动分析按钮 */}
          <Button
            type="button"
            onClick={handleDataCenterAnalyze}
            disabled={isAnalyzing || !formData.address || !selectedRestaurantId}
            className="w-full"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                正在分析区域数据...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                自动分析区域数据
              </>
            )}
          </Button>
        </CardContent>
      </Card>
      
      {/* 数据中心分析结果 */}
      {dataCenterResult && (
        <>
          {/* 热力图数据 */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-orange-500" />
                客流热力分析
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-xs text-muted-foreground cursor-help ml-2">ⓘ 分数说明</span>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-sm">客流分数范围0-100，基于区域人流密度评估：</p>
                    <ul className="text-xs mt-1 space-y-1">
                      <li>• 80-100：非常繁华，人流量极大</li>
                      <li>• 60-79：较繁华，人流量较大</li>
                      <li>• 40-59：一般，人流量适中</li>
                      <li>• 20-39：较冷清，人流量较小</li>
                      <li>• 0-19：冷清，人流量很小</li>
                    </ul>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {/* 工作日 */}
                <div className="space-y-3">
                  <h4 className="font-medium text-foreground">工作日客流</h4>
                  <div className="space-y-2">
                    {['morning', 'lunch', 'dinner'].map(time => {
                      const labels = { morning: '早高峰', lunch: '午餐', dinner: '晚餐' };
                      const timeDesc = { morning: '7:00-9:00', lunch: '11:00-13:00', dinner: '17:00-20:00' };
                      const value = dataCenterResult.trafficHeatmap?.weekday?.[time] || 0;
                      return (
                        <Tooltip key={time}>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-3 cursor-help">
                              <span className="text-sm text-muted-foreground w-16">{labels[time as keyof typeof labels]}</span>
                              <Progress value={value} className="flex-1" />
                              <span className="text-sm font-medium w-10">{value}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>时段：{timeDesc[time as keyof typeof timeDesc]}</p>
                            <p>客流密度：{value >= 80 ? '非常繁华' : value >= 60 ? '较繁华' : value >= 40 ? '一般' : value >= 20 ? '较冷清' : '冷清'}</p>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                </div>
                {/* 周末 */}
                <div className="space-y-3">
                  <h4 className="font-medium text-foreground">周末客流</h4>
                  <div className="space-y-2">
                    {['morning', 'lunch', 'dinner'].map(time => {
                      const labels = { morning: '早高峰', lunch: '午餐', dinner: '晚餐' };
                      const timeDesc = { morning: '9:00-11:00', lunch: '11:00-14:00', dinner: '17:00-21:00' };
                      const value = dataCenterResult.trafficHeatmap?.weekend?.[time] || 0;
                      return (
                        <Tooltip key={time}>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-3 cursor-help">
                              <span className="text-sm text-muted-foreground w-16">{labels[time as keyof typeof labels]}</span>
                              <Progress value={value} className="flex-1" />
                              <span className="text-sm font-medium w-10">{value}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>时段：{timeDesc[time as keyof typeof timeDesc]}</p>
                            <p>客流密度：{value >= 80 ? '非常繁华' : value >= 60 ? '较繁华' : value >= 40 ? '一般' : value >= 20 ? '较冷清' : '冷清'}</p>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                </div>
              </div>
              {/* 区域消费力 */}
              <div className="mt-6 grid grid-cols-3 gap-4">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="text-center p-4 bg-muted/50 rounded-lg cursor-help">
                      <div className="text-2xl font-bold text-primary">{dataCenterResult.avgRentPerSqm || '-'}</div>
                      <div className="text-sm text-muted-foreground">平均租金(元/㎡/月)</div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>区域商铺平均租金水平</p>
                    <p className="text-xs text-muted-foreground">数据来源：周边商铺租金参考</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="text-center p-4 bg-muted/50 rounded-lg cursor-help">
                      <div className="text-2xl font-bold text-primary">{dataCenterResult.avgHousePrice || '-'}</div>
                      <div className="text-sm text-muted-foreground">平均房价(元/㎡)</div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>区域住宅平均房价，反映居民消费能力</p>
                    <p className="text-xs text-muted-foreground">房价越高通常表示区域消费力越强</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="text-center p-4 bg-muted/50 rounded-lg cursor-help">
                      <div className="text-2xl font-bold text-primary">{dataCenterResult.consumptionIndex || '-'}</div>
                      <div className="text-sm text-muted-foreground">消费力指数</div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>综合消费力评分（0-100）</p>
                    <ul className="text-xs mt-1 space-y-1">
                      <li>• 90+：顶级消费区，高端客群集中</li>
                      <li>• 70-89：高消费区，白领/中产为主</li>
                      <li>• 50-69：中等消费区，大众消费为主</li>
                      <li>• 30-49：普通消费区，价格敏感客群</li>
                      <li>• 0-29：低消费区，需谨慎评估</li>
                    </ul>
                  </TooltipContent>
                </Tooltip>
              </div>
            </CardContent>
          </Card>
          
          {/* POI分析 */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-500" />
                POI聚类分析（500米范围）
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 md:grid-cols-7 gap-4">
                {[
                  { key: 'offices', label: '写字楼', icon: Building2, color: 'text-blue-500' },
                  { key: 'malls', label: '商场', icon: ShoppingBag, color: 'text-purple-500' },
                  { key: 'cinemas', label: '电影院', icon: Film, color: 'text-red-500' },
                  { key: 'subways', label: '地铁站', icon: Train, color: 'text-green-500' },
                  { key: 'busStops', label: '公交站', icon: Bus, color: 'text-orange-500' },
                  { key: 'schools', label: '学校', icon: GraduationCap, color: 'text-cyan-500' },
                  { key: 'hospitals', label: '医院', icon: Hospital, color: 'text-pink-500' },
                ].map(poi => {
                  const Icon = poi.icon;
                  const value = dataCenterResult.poi500m?.[poi.key] || 0;
                  return (
                    <div key={poi.key} className="text-center p-3 bg-muted/30 rounded-lg">
                      <Icon className={`w-6 h-6 mx-auto mb-2 ${poi.color}`} />
                      <div className="text-xl font-bold">{value}</div>
                      <div className="text-xs text-muted-foreground">{poi.label}</div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
          
          {/* 竞对分析（手动输入） */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Store className="w-5 h-5 text-red-500" />
                竞对分布分析
                <span className="text-sm font-normal text-muted-foreground">(手动填写)</span>
              </CardTitle>
              <CardDescription>请填写周边500米内的竞争餐厅信息，最多5家</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 竞对输入表单 */}
              <div className="space-y-3">
                {formData.manualCompetitors.map((comp, idx) => (
                  <div key={idx} className="grid grid-cols-4 gap-2 p-3 bg-muted/30 rounded-lg">
                    <Input
                      placeholder="餐厅名称"
                      value={comp.name}
                      onChange={(e) => {
                        const newComps = [...formData.manualCompetitors];
                        newComps[idx].name = e.target.value;
                        setFormData({ ...formData, manualCompetitors: newComps });
                      }}
                      className="bg-background"
                    />
                    <Select
                      value={comp.category}
                      onValueChange={(value) => {
                        const newComps = [...formData.manualCompetitors];
                        newComps[idx].category = value;
                        setFormData({ ...formData, manualCompetitors: newComps });
                      }}
                    >
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="品类" />
                      </SelectTrigger>
                      <SelectContent>
                        {RESTAURANT_SUB_CATEGORIES['中餐']?.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                        <SelectItem value="其他">其他</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="距离(米)"
                      type="number"
                      value={comp.distance}
                      onChange={(e) => {
                        const newComps = [...formData.manualCompetitors];
                        newComps[idx].distance = e.target.value;
                        setFormData({ ...formData, manualCompetitors: newComps });
                      }}
                      className="bg-background"
                    />
                    <Select
                      value={comp.priceRange}
                      onValueChange={(value) => {
                        const newComps = [...formData.manualCompetitors];
                        newComps[idx].priceRange = value;
                        setFormData({ ...formData, manualCompetitors: newComps });
                      }}
                    >
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="价格定位" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="低">低 (&lt;50元)</SelectItem>
                        <SelectItem value="中">中 (50-100元)</SelectItem>
                        <SelectItem value="中高">中高 (100-150元)</SelectItem>
                        <SelectItem value="高">高 (&gt;150元)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
              
              {/* 竞争指数输入 */}
              <div className="grid md:grid-cols-3 gap-4 pt-4 border-t border-border">
                <div>
                  <Label>同品类餐厅数量</Label>
                  <Input
                    type="number"
                    placeholder="例如: 3"
                    value={formData.sameCategoryCount}
                    onChange={(e) => setFormData({ ...formData, sameCategoryCount: e.target.value })}
                    className="bg-background mt-1"
                  />
                </div>
                <div>
                  <Label>竞争饱和度指数 (1-100)</Label>
                  <Input
                    type="number"
                    placeholder="例如: 60"
                    min="1"
                    max="100"
                    value={formData.competitionSaturationIndex}
                    onChange={(e) => setFormData({ ...formData, competitionSaturationIndex: e.target.value })}
                    className="bg-background mt-1"
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <Switch
                    checked={formData.isRedOcean}
                    onCheckedChange={(checked) => setFormData({ ...formData, isRedOcean: checked })}
                  />
                  <Label>红海区域</Label>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* 区域热力评分 */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">区域热力评分（系统自动）</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="text-4xl font-bold text-primary">{formData.heatScore}</div>
                <div className="flex-1">
                  <Slider
                    value={[formData.heatScore]}
                    min={1}
                    max={10}
                    step={1}
                    disabled
                    className="cursor-not-allowed"
                  />
                </div>
                <span className="text-sm text-muted-foreground">/ 10分</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">{dataCenterResult.reasoning}</p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );

  // 渲染现场勘察模块
  const renderSurvey = () => (
    <div className="space-y-6">
      {/* 铺位情况 */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Eye className="w-5 h-5 text-blue-500" />
            铺位情况
          </CardTitle>
          <CardDescription>填写铺位的可视性、通达性和缺陷情况</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 可视性 */}
          <div className="space-y-4">
            <h4 className="font-medium text-foreground flex items-center gap-2">
              <Eye className="w-4 h-4" />
              可视性
            </h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>铺位可视性</Label>
                <Select
                  value={formData.visibility}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, visibility: v }))}
                >
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue placeholder="选择可视性等级" />
                  </SelectTrigger>
                  <SelectContent>
                    {VISIBILITY_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label} - {opt.desc}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>是否被遮挡</Label>
                  <Switch
                    checked={formData.isBlocked}
                    onCheckedChange={(v) => setFormData(prev => ({ ...prev, isBlocked: v }))}
                  />
                </div>
                {formData.isBlocked && (
                  <Input
                    placeholder="描述遮挡情况"
                    value={formData.blockingDesc}
                    onChange={(e) => setFormData(prev => ({ ...prev, blockingDesc: e.target.value }))}
                    className="bg-input border-border"
                  />
                )}
              </div>
            </div>
          </div>
          
          {/* 通达性 */}
          <div className="space-y-4">
            <h4 className="font-medium text-foreground flex items-center gap-2">
              <Navigation className="w-4 h-4" />
              通达性
            </h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>楼层</Label>
                <Select
                  value={formData.floorLevel}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, floorLevel: v }))}
                >
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue placeholder="选择楼层" />
                  </SelectTrigger>
                  <SelectContent>
                    {FLOOR_LEVELS.map(floor => (
                      <SelectItem key={floor} value={floor}>{floor}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>门头宽度（米）</Label>
                <Input
                  type="number"
                  placeholder="例如：8"
                  value={formData.storefrontWidth}
                  onChange={(e) => setFormData(prev => ({ ...prev, storefrontWidth: e.target.value }))}
                  className="bg-input border-border"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <Label className="text-sm">主餐饮层</Label>
                <Switch
                  checked={formData.isMainDiningFloor}
                  onCheckedChange={(v) => setFormData(prev => ({ ...prev, isMainDiningFloor: v }))}
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <Label className="text-sm">扶梯旁</Label>
                <Switch
                  checked={formData.nearEscalator}
                  onCheckedChange={(v) => setFormData(prev => ({ ...prev, nearEscalator: v }))}
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <Label className="text-sm">楼层中间</Label>
                <Switch
                  checked={formData.isMiddleOfFloor}
                  onCheckedChange={(v) => setFormData(prev => ({ ...prev, isMiddleOfFloor: v }))}
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <Label className="text-sm">主通道</Label>
                <Switch
                  checked={formData.isMainCorridor}
                  onCheckedChange={(v) => setFormData(prev => ({ ...prev, isMainCorridor: v }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>是否热门品牌旁</Label>
                <Switch
                  checked={formData.nearPopularBrand}
                  onCheckedChange={(v) => setFormData(prev => ({ ...prev, nearPopularBrand: v }))}
                />
              </div>
              {formData.nearPopularBrand && (
                <Input
                  placeholder="旁边热门品牌名称"
                  value={formData.nearPopularBrandName}
                  onChange={(e) => setFormData(prev => ({ ...prev, nearPopularBrandName: e.target.value }))}
                  className="bg-input border-border"
                />
              )}
            </div>
          </div>
          
          {/* 缺陷 */}
          <div className="space-y-4">
            <h4 className="font-medium text-foreground flex items-center gap-2">
              <Wrench className="w-4 h-4" />
              缺陷情况
            </h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>房型缺陷</Label>
                  <Switch
                    checked={formData.hasShapeDefect}
                    onCheckedChange={(v) => setFormData(prev => ({ ...prev, hasShapeDefect: v }))}
                  />
                </div>
                {formData.hasShapeDefect && (
                  <Textarea
                    placeholder="描述房型缺陷（如：异形、柱子多等）"
                    value={formData.shapeDefectDesc}
                    onChange={(e) => setFormData(prev => ({ ...prev, shapeDefectDesc: e.target.value }))}
                    className="bg-input border-border"
                  />
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>工程条件缺陷</Label>
                  <Switch
                    checked={formData.hasEngineeringDefect}
                    onCheckedChange={(v) => setFormData(prev => ({ ...prev, hasEngineeringDefect: v }))}
                  />
                </div>
                {formData.hasEngineeringDefect && (
                  <Textarea
                    placeholder="描述工程缺陷（如：排烟、电力不足等）"
                    value={formData.engineeringDefectDesc}
                    onChange={(e) => setFormData(prev => ({ ...prev, engineeringDefectDesc: e.target.value }))}
                    className="bg-input border-border"
                  />
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <Label className="text-sm">需上台阶</Label>
                <Switch
                  checked={formData.hasStairs}
                  onCheckedChange={(v) => setFormData(prev => ({ ...prev, hasStairs: v }))}
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <Label className="text-sm">进深巷</Label>
                <Switch
                  checked={formData.hasDeepAlley}
                  onCheckedChange={(v) => setFormData(prev => ({ ...prev, hasDeepAlley: v }))}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* 客流量市调 */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Users className="w-5 h-5 text-green-500" />
            客流量市调
          </CardTitle>
          <CardDescription>选择3个市调品牌（不同客单价），记录至少3天的早/中/晚上座率</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 品牌A */}
          <div className="p-4 border border-cyan-500/30 rounded-lg bg-cyan-500/5">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="outline" className="bg-cyan-500/20 text-cyan-500 border-cyan-500">品牌A</Badge>
              <Input
                placeholder="品牌名称"
                value={formData.brandAName}
                onChange={(e) => setFormData(prev => ({ ...prev, brandAName: e.target.value }))}
                className="bg-input border-border flex-1"
              />
              <Input
                placeholder="客单价区间"
                value={formData.brandAPriceRange}
                onChange={(e) => setFormData(prev => ({ ...prev, brandAPriceRange: e.target.value }))}
                className="bg-input border-border w-32"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              {['Mon', 'Fri', 'Sat'].map(day => {
                const dayLabel = { Mon: '周一', Fri: '周五', Sat: '周六' }[day];
                return (
                  <div key={day} className="space-y-2">
                    <Label className="text-sm text-muted-foreground">{dayLabel}</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="number"
                        placeholder="午市%"
                        value={formData[`brandA${day}Lunch` as keyof typeof formData] as string}
                        onChange={(e) => setFormData(prev => ({ ...prev, [`brandA${day}Lunch`]: e.target.value }))}
                        className="bg-input border-border text-sm"
                      />
                      <Input
                        type="number"
                        placeholder="晚市%"
                        value={formData[`brandA${day}Dinner` as keyof typeof formData] as string}
                        onChange={(e) => setFormData(prev => ({ ...prev, [`brandA${day}Dinner`]: e.target.value }))}
                        className="bg-input border-border text-sm"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* 品牌B */}
          <div className="p-4 border border-orange-500/30 rounded-lg bg-orange-500/5">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="outline" className="bg-orange-500/20 text-orange-500 border-orange-500">品牌B</Badge>
              <Input
                placeholder="品牌名称"
                value={formData.brandBName}
                onChange={(e) => setFormData(prev => ({ ...prev, brandBName: e.target.value }))}
                className="bg-input border-border flex-1"
              />
              <Input
                placeholder="客单价区间"
                value={formData.brandBPriceRange}
                onChange={(e) => setFormData(prev => ({ ...prev, brandBPriceRange: e.target.value }))}
                className="bg-input border-border w-32"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              {['Mon', 'Fri', 'Sat'].map(day => {
                const dayLabel = { Mon: '周一', Fri: '周五', Sat: '周六' }[day];
                return (
                  <div key={day} className="space-y-2">
                    <Label className="text-sm text-muted-foreground">{dayLabel}</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="number"
                        placeholder="午市%"
                        value={formData[`brandB${day}Lunch` as keyof typeof formData] as string}
                        onChange={(e) => setFormData(prev => ({ ...prev, [`brandB${day}Lunch`]: e.target.value }))}
                        className="bg-input border-border text-sm"
                      />
                      <Input
                        type="number"
                        placeholder="晚市%"
                        value={formData[`brandB${day}Dinner` as keyof typeof formData] as string}
                        onChange={(e) => setFormData(prev => ({ ...prev, [`brandB${day}Dinner`]: e.target.value }))}
                        className="bg-input border-border text-sm"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* 品牌C */}
          <div className="p-4 border border-purple-500/30 rounded-lg bg-purple-500/5">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="outline" className="bg-purple-500/20 text-purple-500 border-purple-500">品牌C</Badge>
              <Input
                placeholder="品牌名称"
                value={formData.brandCName}
                onChange={(e) => setFormData(prev => ({ ...prev, brandCName: e.target.value }))}
                className="bg-input border-border flex-1"
              />
              <Input
                placeholder="客单价区间"
                value={formData.brandCPriceRange}
                onChange={(e) => setFormData(prev => ({ ...prev, brandCPriceRange: e.target.value }))}
                className="bg-input border-border w-32"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              {['Mon', 'Fri', 'Sat'].map(day => {
                const dayLabel = { Mon: '周一', Fri: '周五', Sat: '周六' }[day];
                return (
                  <div key={day} className="space-y-2">
                    <Label className="text-sm text-muted-foreground">{dayLabel}</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="number"
                        placeholder="午市%"
                        value={formData[`brandC${day}Lunch` as keyof typeof formData] as string}
                        onChange={(e) => setFormData(prev => ({ ...prev, [`brandC${day}Lunch`]: e.target.value }))}
                        className="bg-input border-border text-sm"
                      />
                      <Input
                        type="number"
                        placeholder="晚市%"
                        value={formData[`brandC${day}Dinner` as keyof typeof formData] as string}
                        onChange={(e) => setFormData(prev => ({ ...prev, [`brandC${day}Dinner`]: e.target.value }))}
                        className="bg-input border-border text-sm"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* 商场品牌业绩参考 */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-yellow-500" />
            商场品牌业绩参考
          </CardTitle>
          <CardDescription>选择3个品牌填写他们最近的业绩情况</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map(idx => (
            <div key={idx} className="p-4 border border-border rounded-lg">
              <div className="grid md:grid-cols-5 gap-4">
                <Input
                  placeholder={`品牌${idx}名称`}
                  value={formData[`refBrand${idx}Name` as keyof typeof formData] as string}
                  onChange={(e) => setFormData(prev => ({ ...prev, [`refBrand${idx}Name`]: e.target.value }))}
                  className="bg-input border-border"
                />
                <Input
                  placeholder="品类"
                  value={formData[`refBrand${idx}Category` as keyof typeof formData] as string}
                  onChange={(e) => setFormData(prev => ({ ...prev, [`refBrand${idx}Category`]: e.target.value }))}
                  className="bg-input border-border"
                />
                <Input
                  type="number"
                  placeholder="月营业额(万)"
                  value={formData[`refBrand${idx}MonthlyRevenue` as keyof typeof formData] as string}
                  onChange={(e) => setFormData(prev => ({ ...prev, [`refBrand${idx}MonthlyRevenue`]: e.target.value }))}
                  className="bg-input border-border"
                />
                <Input
                  type="number"
                  placeholder="日翻台率"
                  value={formData[`refBrand${idx}DailyTurnover` as keyof typeof formData] as string}
                  onChange={(e) => setFormData(prev => ({ ...prev, [`refBrand${idx}DailyTurnover`]: e.target.value }))}
                  className="bg-input border-border"
                />
                <Input
                  placeholder="备注"
                  value={formData[`refBrand${idx}Remark` as keyof typeof formData] as string}
                  onChange={(e) => setFormData(prev => ({ ...prev, [`refBrand${idx}Remark`]: e.target.value }))}
                  className="bg-input border-border"
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
      
      {/* 手动评分 */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">选址评分（手动填写）</CardTitle>
          <CardDescription>根据实地考察情况，为各维度打分（1-10分）</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {SCORE_DIMENSIONS.filter(d => d.key !== 'heatScore').map(dimension => (
            <div key={dimension.key} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label className="text-foreground">{dimension.label}</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" className="text-muted-foreground hover:text-primary">
                        <Info className="w-4 h-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-sm p-4">
                      <div className="space-y-2">
                        <p className="font-semibold text-foreground">{dimension.label}评分标准</p>
                        <div className="space-y-1 text-xs">
                          {dimension.criteria.map((c, i) => (
                            <div key={i} className="flex gap-2">
                              <span className="font-medium text-primary whitespace-nowrap">{c.score}</span>
                              <span className="text-muted-foreground">{c.desc}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <span className="text-lg font-bold text-primary">
                  {formData[dimension.key as keyof typeof formData]}分
                </span>
              </div>
              <Slider
                value={[formData[dimension.key as keyof typeof formData] as number]}
                onValueChange={([v]) => setFormData(prev => ({ ...prev, [dimension.key]: v }))}
                min={1}
                max={10}
                step={1}
              />
              <p className="text-xs text-muted-foreground">{dimension.description}</p>
              {/* 显示当前分数对应的说明 */}
              <p className="text-xs text-primary/80 bg-primary/10 px-2 py-1 rounded">
                当前评分说明：{dimension.criteria.find(c => {
                  const score = formData[dimension.key as keyof typeof formData] as number;
                  const [min, max] = c.score.replace('分', '').split('-').map(Number);
                  return score >= min && score <= max;
                })?.desc || '请选择分数'}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );

  // 渲染财务测算模块
  const renderFinancial = () => (
    <div className="space-y-6">
      {/* 基础参数 */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Calculator className="w-5 h-5 text-green-500" />
            财务基础参数
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>预估客单价（元）</Label>
              <Input
                type="number"
                placeholder="例如：80"
                value={formData.estimatedPrice}
                onChange={(e) => setFormData(prev => ({ ...prev, estimatedPrice: e.target.value }))}
                className="bg-input border-border"
              />
            </div>
            <div className="space-y-2">
              <Label>预估毛利率（%）</Label>
              <Input
                type="number"
                placeholder="例如：60"
                value={formData.grossMarginRate}
                onChange={(e) => setFormData(prev => ({ ...prev, grossMarginRate: e.target.value }))}
                className="bg-input border-border"
              />
            </div>
            <div className="space-y-2">
              <Label>座位数</Label>
              <Input
                type="number"
                placeholder="例如：60"
                value={formData.seats}
                onChange={(e) => setFormData(prev => ({ ...prev, seats: e.target.value }))}
                className="bg-input border-border"
              />
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>月租金（元）</Label>
              <Input
                type="number"
                value={formData.monthlyRent}
                disabled
                className="bg-muted border-border"
              />
            </div>
            <div className="space-y-2">
              <Label>月人工成本（元）</Label>
              <Input
                type="number"
                placeholder="例如：50000"
                value={formData.monthlyLabor}
                onChange={(e) => setFormData(prev => ({ ...prev, monthlyLabor: e.target.value }))}
                className="bg-input border-border"
              />
            </div>
            <div className="space-y-2">
              <Label>其他月成本（元）</Label>
              <Input
                type="number"
                placeholder="水电、物料等"
                value={formData.otherCosts}
                onChange={(e) => setFormData(prev => ({ ...prev, otherCosts: e.target.value }))}
                className="bg-input border-border"
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* 预计营收 */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            预计营收
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>预计月营收（元）</Label>
            <Input
              type="number"
              placeholder="例如：300000"
              value={formData.estimatedMonthlyRevenue}
              onChange={(e) => setFormData(prev => ({ ...prev, estimatedMonthlyRevenue: e.target.value }))}
              className="bg-input border-border"
            />
          </div>
        </CardContent>
      </Card>
      
      {/* 预计投资 */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-yellow-500" />
            预计投资
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>装修费用（元）</Label>
              <Input
                type="number"
                placeholder="例如：500000"
                value={formData.decorationCost}
                onChange={(e) => setFormData(prev => ({ ...prev, decorationCost: e.target.value }))}
                className="bg-input border-border"
              />
            </div>
            <div className="space-y-2">
              <Label>设备费用（元）</Label>
              <Input
                type="number"
                placeholder="例如：200000"
                value={formData.equipmentCost}
                onChange={(e) => setFormData(prev => ({ ...prev, equipmentCost: e.target.value }))}
                className="bg-input border-border"
              />
            </div>
            <div className="space-y-2">
              <Label>首批物料（元）</Label>
              <Input
                type="number"
                placeholder="例如：50000"
                value={formData.initialInventory}
                onChange={(e) => setFormData(prev => ({ ...prev, initialInventory: e.target.value }))}
                className="bg-input border-border"
              />
            </div>
            <div className="space-y-2">
              <Label>押金（元）</Label>
              <Input
                type="number"
                placeholder="例如：90000"
                value={formData.deposit}
                onChange={(e) => setFormData(prev => ({ ...prev, deposit: e.target.value }))}
                className="bg-input border-border"
              />
            </div>
            <div className="space-y-2">
              <Label>其他投资（元）</Label>
              <Input
                type="number"
                placeholder="例如：30000"
                value={formData.otherInvestment}
                onChange={(e) => setFormData(prev => ({ ...prev, otherInvestment: e.target.value }))}
                className="bg-input border-border"
              />
            </div>
            <div className="space-y-2">
              <Label>预计总投资（元）</Label>
              <Input
                type="number"
                placeholder="或直接填写总投资"
                value={formData.estimatedInvestment}
                onChange={(e) => setFormData(prev => ({ ...prev, estimatedInvestment: e.target.value }))}
                className="bg-input border-border"
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* 财务指标计算结果 */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">财务指标（系统自动计算）</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {financials.monthlyFixedCosts > 0 ? `¥${financials.monthlyFixedCosts.toLocaleString()}` : '-'}
              </div>
              <div className="text-sm text-muted-foreground">月固定成本</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-orange-500">
                {financials.breakEvenRevenue > 0 ? `¥${Math.round(financials.breakEvenRevenue).toLocaleString()}` : '-'}
              </div>
              <div className="text-sm text-muted-foreground">保本月营业额</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-blue-500">
                {financials.dailyTurnover > 0 ? financials.dailyTurnover.toFixed(2) : '-'}
              </div>
              <div className="text-sm text-muted-foreground">保本翻台率</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className={`text-2xl font-bold ${financials.monthlyProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {financials.monthlyProfit !== 0 ? `¥${Math.round(financials.monthlyProfit).toLocaleString()}` : '-'}
              </div>
              <div className="text-sm text-muted-foreground">预计月利润</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-purple-500">
                {financials.estimatedInvestment > 0 ? `¥${financials.estimatedInvestment.toLocaleString()}` : '-'}
              </div>
              <div className="text-sm text-muted-foreground">总投资</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className={`text-2xl font-bold ${financials.paybackPeriod <= 24 ? 'text-green-500' : financials.paybackPeriod <= 36 ? 'text-yellow-500' : 'text-red-500'}`}>
                {financials.paybackPeriod > 0 ? `${financials.paybackPeriod}个月` : '-'}
              </div>
              <div className="text-sm text-muted-foreground">回本周期</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg col-span-2">
              <div className={`text-2xl font-bold ${financials.annualROI >= 30 ? 'text-green-500' : financials.annualROI >= 15 ? 'text-yellow-500' : 'text-red-500'}`}>
                {financials.annualROI !== 0 ? `${financials.annualROI.toFixed(1)}%` : '-'}
              </div>
              <div className="text-sm text-muted-foreground">年投资回报率</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

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
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <MapPin className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-foreground">选址评估</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="container py-8">
        <form onSubmit={handleSubmit}>
          {/* 步骤指示器 */}
          {renderStepIndicator()}
          
          {/* 步骤内容 */}
          <div className="max-w-4xl mx-auto">
            {currentStep === 0 && renderDataCenter()}
            {currentStep === 1 && renderSurvey()}
            {currentStep === 2 && renderFinancial()}
          </div>
          
          {/* 底部导航 */}
          <div className="max-w-4xl mx-auto mt-8 flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
              disabled={currentStep === 0}
            >
              上一步
            </Button>
            
            {currentStep < STEPS.length - 1 ? (
              <Button
                type="button"
                onClick={() => setCurrentStep(prev => Math.min(STEPS.length - 1, prev + 1))}
              >
                下一步
              </Button>
            ) : (
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    生成评估报告...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    生成评估报告
                  </>
                )}
              </Button>
            )}
          </div>
        </form>
      </main>
    </div>
  );
}
