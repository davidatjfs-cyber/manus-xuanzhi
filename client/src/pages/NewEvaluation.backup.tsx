import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Link, useLocation, useParams } from "wouter";
import { ArrowLeft, MapPin, Loader2, Info, Search, Sparkles } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { AGE_GROUPS, CONSUMPTION_LEVELS, SCORE_DIMENSIONS } from "@shared/types";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { MapView } from "@/components/Map";

export default function NewEvaluation() {
  const { loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const params = useParams<{ restaurantId?: string }>();
  
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>(params.restaurantId || '');
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [searchAddress, setSearchAddress] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  
  const { data: restaurants } = trpc.restaurant.list.useQuery(undefined, { enabled: isAuthenticated });
  
  const [formData, setFormData] = useState({
    address: '',
    latitude: '',
    longitude: '',
    area: '',
    monthlyRent: '',
    // 周边餐厅市调
    hasSameCategory: false, // 是否有同品类餐厅
    // 品牌A市调数据
    brandAName: '', // 品牌A名称
    brandAMonLunch: '', // 品牌A周一午市上座率
    brandAMonDinner: '', // 品牌A周一晚市上座率
    brandAFriLunch: '', // 品牌A周五午市上座率
    brandAFriDinner: '', // 品牌A周五晚市上座率
    brandASatLunch: '', // 品牌A周六午市上座率
    brandASatDinner: '', // 品牌A周六晚市上座率
    // 品牌B市调数据
    brandBName: '', // 品牌B名称
    brandBMonLunch: '', // 品牌B周一午市上座率
    brandBMonDinner: '', // 品牌B周一晚市上座率
    brandBFriLunch: '', // 品牌B周五午市上座率
    brandBFriDinner: '', // 品牌B周五晚市上座率
    brandBSatLunch: '', // 品牌B周六午市上座率
    brandBSatDinner: '', // 品牌B周六晚市上座率
    // 品牌C市调数据
    brandCName: '', // 品牌C名称
    brandCMonLunch: '', // 品牌C周一午市上座率
    brandCMonDinner: '', // 品牌C周一晚市上座率
    brandCFriLunch: '', // 品牌C周五午市上座率
    brandCFriDinner: '', // 品牌C周五晚市上座率
    brandCSatLunch: '', // 品牌C周六午市上座率
    brandCSatDinner: '', // 品牌C周六晚市上座率
    isMainCorridor: false,
    storefrontWidth: '',
    hasStairs: false,
    hasDeepAlley: false,
    surroundingDesc: '',
    population1km: '',
    population3km: '',
    officeBuildings: '',
    estimatedWorkstations: '',
    parkingSpots: '',
    ageGroup: '',
    consumptionLevel: '',
    // 评分
    trafficScore: 5,
    locationScore: 5,
    customerMatchScore: 5,
    heatScore: 0, // 热力值自动计算，默认0
    costScore: 5,
    competitionScore: 5,
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

  const analyzeSurroundings = trpc.surroundings.analyze.useMutation();

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
    
    // 移除旧标记
    if (markerRef.current) {
      markerRef.current.map = null;
    }
    
    // 创建新标记
    markerRef.current = new google.maps.marker.AdvancedMarkerElement({
      map: mapRef.current,
      position: { lat, lng },
      title: '选址位置',
    });
  };

  // 地址搜索功能
  const handleAddressSearch = () => {
    if (!searchAddress.trim() || !mapRef.current) {
      toast.error('请输入要搜索的地址');
      return;
    }
    
    setIsSearching(true);
    const geocoder = new google.maps.Geocoder();
    
    geocoder.geocode({ address: searchAddress }, (results, status) => {
      setIsSearching(false);
      
      if (status === 'OK' && results && results[0]) {
        const location = results[0].geometry.location;
        const lat = location.lat();
        const lng = location.lng();
        
        // 更新表单数据
        setFormData(prev => ({
          ...prev,
          address: results[0].formatted_address,
          latitude: lat.toFixed(7),
          longitude: lng.toFixed(7),
        }));
        
        // 移动地图中心
        setMapCenter({ lat, lng });
        mapRef.current?.setCenter({ lat, lng });
        mapRef.current?.setZoom(16);
        
        // 更新标记
        updateMarker(lat, lng);
        
        toast.success('地址定位成功');
      } else {
        toast.error('未找到该地址，请尝试更详细的地址');
      }
    });
  };

  // 周边环境自动调研
  const handleAnalyzeSurroundings = async () => {
    if (!formData.latitude || !formData.longitude) {
      toast.error('请先选择或搜索一个位置');
      return;
    }
    
    if (!mapRef.current) {
      toast.error('地图未加载完成');
      return;
    }
    
    setIsAnalyzing(true);
    const lat = parseFloat(formData.latitude);
    const lng = parseFloat(formData.longitude);
    const location = new google.maps.LatLng(lat, lng);
    
    try {
      const placesService = new google.maps.places.PlacesService(mapRef.current);
      
      // 搜索周边写字楼
      const officeResults = await new Promise<google.maps.places.PlaceResult[]>((resolve) => {
        placesService.nearbySearch({
          location,
          radius: 1000,
          type: 'office' as any,
          keyword: '写字楼 办公楼',
        }, (results, status) => {
          resolve(status === 'OK' && results ? results : []);
        });
      });
      
      // 搜索周边商场
      const mallResults = await new Promise<google.maps.places.PlaceResult[]>((resolve) => {
        placesService.nearbySearch({
          location,
          radius: 1000,
          type: 'shopping_mall' as any,
        }, (results, status) => {
          resolve(status === 'OK' && results ? results : []);
        });
      });
      
      // 搜索周边餐厅（竞品）
      const restaurantResults = await new Promise<google.maps.places.PlaceResult[]>((resolve) => {
        placesService.nearbySearch({
          location,
          radius: 500,
          type: 'restaurant' as any,
        }, (results, status) => {
          resolve(status === 'OK' && results ? results : []);
        });
      });
      
      // 搜索周边地铁站
      const transitResults = await new Promise<google.maps.places.PlaceResult[]>((resolve) => {
        placesService.nearbySearch({
          location,
          radius: 1000,
          type: 'subway_station' as any,
        }, (results, status) => {
          resolve(status === 'OK' && results ? results : []);
        });
      });
      
      // 估算写字楼数量和工位
      const officeCount = officeResults.length;
      const estimatedWorkstations = officeCount * 2000; // 假设每栋写字楼平均2000工位
      
      // 生成周边环境描述
      const surroundingParts: string[] = [];
      
      if (mallResults.length > 0) {
        const mallNames = mallResults.slice(0, 3).map(m => m.name).join('、');
        surroundingParts.push(`周边有${mallResults.length}个商场/购物中心（${mallNames}等）`);
      }
      
      if (officeResults.length > 0) {
        const officeNames = officeResults.slice(0, 3).map(o => o.name).join('、');
        surroundingParts.push(`${officeResults.length}栋写字楼/办公楼（${officeNames}等）`);
      }
      
      if (transitResults.length > 0) {
        const transitNames = transitResults.slice(0, 2).map(t => t.name).join('、');
        surroundingParts.push(`${transitResults.length}个地铁站（${transitNames}）`);
      }
      
      // 获取周边餐厅品牌名称（前3家）
      const nearbyRestaurantNames = restaurantResults
        .slice(0, 3)
        .map(r => r.name || '未知餐厅')
        .filter(name => name && name.length > 0);
      
      if (restaurantResults.length > 0) {
        const restaurantNames = nearbyRestaurantNames.slice(0, 3).join('、');
        surroundingParts.push(`周边500米内有${restaurantResults.length}家餐饮店（${restaurantNames}等）`);
      }
      
      const surroundingDesc = surroundingParts.length > 0 
        ? surroundingParts.join('；') + '。'
        : '周边商业配套信息较少，建议实地考察。';
      
      // 自动计算区域热力值（1-10分）
      // 基于商场数量、写字楼数量、地铁站数量、餐厅密度等综合评估
      let heatScore = 1;
      // 商场贡献（最多+2.5分）
      heatScore += Math.min(mallResults.length * 0.5, 2.5);
      // 写字楼贡献（最多+2.5分）
      heatScore += Math.min(officeResults.length * 0.3, 2.5);
      // 地铁站贡献（最多+2分）
      heatScore += Math.min(transitResults.length * 1, 2);
      // 餐厅密度贡献（最多+2分）
      heatScore += Math.min(restaurantResults.length * 0.1, 2);
      // 四舍五入到整数，确保在1-10范围内
      const calculatedHeatScore = Math.max(1, Math.min(10, Math.round(heatScore)));
      
      // 调用LLM接口智能估算人口、停车位、年龄层、消费能力等数据
      try {
        const llmResult = await analyzeSurroundings.mutateAsync({
          address: formData.address || '',
          latitude: lat,
          longitude: lng,
          officeCount,
          mallCount: mallResults.length,
          restaurantCount: restaurantResults.length,
          transitCount: transitResults.length,
          surroundingDesc,
        });
        
        // 映射LLM返回的年龄层到表单选项
        const ageGroupMap: Record<string, string> = {
          '18-24': '18-25岁',
          '25-35': '25-35岁',
          '35-45': '35-45岁',
          '45-55': '45-55岁',
          '55+': '55岁以上',
        };
        
        // 映射LLM返回的消费能力到表单选项
        const consumptionMap: Record<string, string> = {
          'low': '低消费',
          'medium': '中等消费',
          'high': '高消费',
          'premium': '高消费',
        };
        
        // 更新表单数据（包含LLM估算结果、热力值、周边餐厅品牌）
        setFormData(prev => ({
          ...prev,
          officeBuildings: officeCount.toString(),
          estimatedWorkstations: estimatedWorkstations.toString(),
          surroundingDesc: surroundingDesc + (llmResult.reasoning ? `\n\nAI分析：${llmResult.reasoning}` : ''),
          population1km: llmResult.population1km?.toString() || '',
          population3km: llmResult.population3km?.toString() || '',
          parkingSpots: llmResult.parkingSpots?.toString() || '',
          ageGroup: ageGroupMap[llmResult.ageGroup] || '混合',
          consumptionLevel: consumptionMap[llmResult.consumptionLevel] || '中等消费',
          // 自动计算的热力值
          heatScore: calculatedHeatScore,
          // 周边餐厅品牌（自动填充到品牌A/B/C名称）
          brandAName: nearbyRestaurantNames[0] || '',
          brandBName: nearbyRestaurantNames[1] || '',
          brandCName: nearbyRestaurantNames[2] || '',
        }));
        
        toast.success(`周边环境智能分析完成，区域热力值：${calculatedHeatScore}分`);
      } catch (llmError) {
        console.error('LLM分析失败:', llmError);
        // 即使LLM失败，也更新基础数据（包括热力值和餐厅品牌）
        setFormData(prev => ({
          ...prev,
          officeBuildings: officeCount.toString(),
          estimatedWorkstations: estimatedWorkstations.toString(),
          surroundingDesc,
          heatScore: calculatedHeatScore,
          // 周边餐厅品牌（自动填充到品牌A/B/C名称）
          brandAName: nearbyRestaurantNames[0] || '',
          brandBName: nearbyRestaurantNames[1] || '',
          brandCName: nearbyRestaurantNames[2] || '',
        }));
        toast.success(`周边环境基础分析完成，区域热力值：${calculatedHeatScore}分（部分数据需手动填写）`);
      }
    } catch (error) {
      console.error('周边环境分析失败:', error);
      toast.error('周边环境分析失败，请稍后重试');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleMapReady = (map: google.maps.Map) => {
    mapRef.current = map;
    
    // 添加点击事件监听器
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
        
        // 更新标记
        updateMarker(lat, lng);
        
        // 使用 Geocoder 获取地址
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
          if (status === 'OK' && results && results[0]) {
            setFormData(prev => ({
              ...prev,
              address: results[0].formatted_address,
            }));
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

    // 检查上座率数据完整性
    const occupancyWarnings: string[] = [];
    
    // 检查品牌A
    if (formData.brandAName) {
      const brandAFields = [
        { field: 'brandAMonLunch', label: '周一午市' },
        { field: 'brandAMonDinner', label: '周一晚市' },
        { field: 'brandAFriLunch', label: '周五午市' },
        { field: 'brandAFriDinner', label: '周五晚市' },
        { field: 'brandASatLunch', label: '周六午市' },
        { field: 'brandASatDinner', label: '周六晚市' },
      ];
      const missingA = brandAFields.filter(f => !formData[f.field as keyof typeof formData]).map(f => f.label);
      if (missingA.length > 0) {
        occupancyWarnings.push(`品牌A「${formData.brandAName}」缺少: ${missingA.join('、')}`);
      }
    }
    
    // 检查品牌B
    if (formData.brandBName) {
      const brandBFields = [
        { field: 'brandBMonLunch', label: '周一午市' },
        { field: 'brandBMonDinner', label: '周一晚市' },
        { field: 'brandBFriLunch', label: '周五午市' },
        { field: 'brandBFriDinner', label: '周五晚市' },
        { field: 'brandBSatLunch', label: '周六午市' },
        { field: 'brandBSatDinner', label: '周六晚市' },
      ];
      const missingB = brandBFields.filter(f => !formData[f.field as keyof typeof formData]).map(f => f.label);
      if (missingB.length > 0) {
        occupancyWarnings.push(`品牌B「${formData.brandBName}」缺少: ${missingB.join('、')}`);
      }
    }
    
    // 检查品牌C
    if (formData.brandCName) {
      const brandCFields = [
        { field: 'brandCMonLunch', label: '周一午市' },
        { field: 'brandCMonDinner', label: '周一晚市' },
        { field: 'brandCFriLunch', label: '周五午市' },
        { field: 'brandCFriDinner', label: '周五晚市' },
        { field: 'brandCSatLunch', label: '周六午市' },
        { field: 'brandCSatDinner', label: '周六晚市' },
      ];
      const missingC = brandCFields.filter(f => !formData[f.field as keyof typeof formData]).map(f => f.label);
      if (missingC.length > 0) {
        occupancyWarnings.push(`品牌C「${formData.brandCName}」缺少: ${missingC.join('、')}`);
      }
    }
    
    // 如果有警告，显示提示但不阻止提交
    if (occupancyWarnings.length > 0) {
      toast.warning(
        `上座率数据不完整\n${occupancyWarnings.join('\n')}\n\n已继续提交，建议补充完整数据以获得更准确的分析`,
        { duration: 6000 }
      );
    }

    createMutation.mutate({
      restaurantId: parseInt(selectedRestaurantId),
      address: formData.address,
      latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
      longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
      area: parseInt(formData.area),
      monthlyRent: parseInt(formData.monthlyRent),
      // 周边餐厅市调数据
      hasSameCategory: formData.hasSameCategory,
      // 品牌A市调数据
      brandAName: formData.brandAName || undefined,
      brandAMonLunch: formData.brandAMonLunch ? parseInt(formData.brandAMonLunch) : undefined,
      brandAMonDinner: formData.brandAMonDinner ? parseInt(formData.brandAMonDinner) : undefined,
      brandAFriLunch: formData.brandAFriLunch ? parseInt(formData.brandAFriLunch) : undefined,
      brandAFriDinner: formData.brandAFriDinner ? parseInt(formData.brandAFriDinner) : undefined,
      brandASatLunch: formData.brandASatLunch ? parseInt(formData.brandASatLunch) : undefined,
      brandASatDinner: formData.brandASatDinner ? parseInt(formData.brandASatDinner) : undefined,
      // 品牌B市调数据
      brandBName: formData.brandBName || undefined,
      brandBMonLunch: formData.brandBMonLunch ? parseInt(formData.brandBMonLunch) : undefined,
      brandBMonDinner: formData.brandBMonDinner ? parseInt(formData.brandBMonDinner) : undefined,
      brandBFriLunch: formData.brandBFriLunch ? parseInt(formData.brandBFriLunch) : undefined,
      brandBFriDinner: formData.brandBFriDinner ? parseInt(formData.brandBFriDinner) : undefined,
      brandBSatLunch: formData.brandBSatLunch ? parseInt(formData.brandBSatLunch) : undefined,
      brandBSatDinner: formData.brandBSatDinner ? parseInt(formData.brandBSatDinner) : undefined,
      // 品牌C市调数据
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
              <div className="w-8 h-8 rounded-lg bg-[oklch(0.55_0.12_195)] flex items-center justify-center">
                <MapPin className="w-4 h-4 text-background" />
              </div>
              <span className="font-semibold text-foreground">选址评估</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="container py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* 左侧：基本信息 */}
            <div className="space-y-6">
              {/* 选择餐厅 */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">选择餐厅项目</CardTitle>
                  <CardDescription>选择要进行选址评估的餐厅</CardDescription>
                </CardHeader>
                <CardContent>
                  <Select
                    value={selectedRestaurantId}
                    onValueChange={setSelectedRestaurantId}
                  >
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
                  {!restaurants?.length && (
                    <p className="text-sm text-muted-foreground mt-2">
                      还没有餐厅项目，
                      <Link href="/restaurant/new" className="text-primary hover:underline">
                        点击创建
                      </Link>
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* 选址基本信息 */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">选址基本信息</CardTitle>
                  <CardDescription>填写铺位的基本情况</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-foreground">地址 *</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="输入地址后按回车或点击搜索定位"
                        value={formData.address}
                        onChange={(e) => {
                          setFormData(prev => ({ ...prev, address: e.target.value }));
                          setSearchAddress(e.target.value);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (formData.address.trim() && mapRef.current) {
                              setSearchAddress(formData.address);
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
                                  setSearchAddress(results[0].formatted_address);
                                  setMapCenter({ lat, lng });
                                  mapRef.current?.setCenter({ lat, lng });
                                  mapRef.current?.setZoom(16);
                                  updateMarker(lat, lng);
                                  toast.success('地址定位成功');
                                } else {
                                  toast.error('未找到该地址，请尝试更详细的地址');
                                }
                              });
                            }
                          }
                        }}
                        className="bg-input border-border flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          if (formData.address.trim() && mapRef.current) {
                            setSearchAddress(formData.address);
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
                                setSearchAddress(results[0].formatted_address);
                                setMapCenter({ lat, lng });
                                mapRef.current?.setCenter({ lat, lng });
                                mapRef.current?.setZoom(16);
                                updateMarker(lat, lng);
                                toast.success('地址定位成功');
                              } else {
                                toast.error('未找到该地址，请尝试更详细的地址');
                              }
                            });
                          } else {
                            toast.error('请先输入地址');
                          }
                        }}
                        disabled={isSearching}
                        className="border-primary text-primary hover:bg-primary/10"
                      >
                        {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

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

                  <div className="space-y-2">
                    <Label className="text-foreground">门头宽度（米）</Label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="例如：6.5"
                      value={formData.storefrontWidth}
                      onChange={(e) => setFormData(prev => ({ ...prev, storefrontWidth: e.target.value }))}
                      className="bg-input border-border"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-input border border-border">
                      <Label className="text-foreground">主通道位置</Label>
                      <Switch
                        checked={formData.isMainCorridor}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isMainCorridor: checked }))}
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-input border border-border">
                      <Label className="text-foreground">需要上台阶</Label>
                      <Switch
                        checked={formData.hasStairs}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, hasStairs: checked }))}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-input border border-border">
                    <Label className="text-foreground">进深巷/不临街</Label>
                    <Switch
                      checked={formData.hasDeepAlley}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, hasDeepAlley: checked }))}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* 周边餐厅市调 */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">周边餐厅市调</CardTitle>
                  <CardDescription>观察周边餐厅的竞争情况和上座率，点击“自动分析”可自动获取品牌名称</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* 同品类餐厅 */}
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-foreground">是否有同品类餐厅</Label>
                      <p className="text-sm text-muted-foreground">周边500米内是否有与您相同类型的餐厅</p>
                    </div>
                    <Switch
                      checked={formData.hasSameCategory}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, hasSameCategory: checked }))}
                    />
                  </div>

                  {/* 品牌A市调 */}
                  <div className="space-y-4 p-4 rounded-lg bg-muted/30 border border-border">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[oklch(0.55_0.12_195)] flex items-center justify-center text-background font-bold text-sm">A</div>
                      <Input
                        placeholder="品牌A名称（如：海底捞）"
                        value={formData.brandAName}
                        onChange={(e) => setFormData(prev => ({ ...prev, brandAName: e.target.value }))}
                        className="bg-input border-border flex-1"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground font-medium">周一</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs text-muted-foreground">午市%</Label>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              placeholder="午"
                              value={formData.brandAMonLunch}
                              onChange={(e) => setFormData(prev => ({ ...prev, brandAMonLunch: e.target.value }))}
                              className="bg-input border-border h-9"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">晚市%</Label>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              placeholder="晚"
                              value={formData.brandAMonDinner}
                              onChange={(e) => setFormData(prev => ({ ...prev, brandAMonDinner: e.target.value }))}
                              className="bg-input border-border h-9"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground font-medium">周五</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs text-muted-foreground">午市%</Label>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              placeholder="午"
                              value={formData.brandAFriLunch}
                              onChange={(e) => setFormData(prev => ({ ...prev, brandAFriLunch: e.target.value }))}
                              className="bg-input border-border h-9"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">晚市%</Label>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              placeholder="晚"
                              value={formData.brandAFriDinner}
                              onChange={(e) => setFormData(prev => ({ ...prev, brandAFriDinner: e.target.value }))}
                              className="bg-input border-border h-9"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground font-medium">周六</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs text-muted-foreground">午市%</Label>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              placeholder="午"
                              value={formData.brandASatLunch}
                              onChange={(e) => setFormData(prev => ({ ...prev, brandASatLunch: e.target.value }))}
                              className="bg-input border-border h-9"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">晚市%</Label>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              placeholder="晚"
                              value={formData.brandASatDinner}
                              onChange={(e) => setFormData(prev => ({ ...prev, brandASatDinner: e.target.value }))}
                              className="bg-input border-border h-9"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 品牌B市调 */}
                  <div className="space-y-4 p-4 rounded-lg bg-muted/30 border border-border">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[oklch(0.65_0.15_55)] flex items-center justify-center text-background font-bold text-sm">B</div>
                      <Input
                        placeholder="品牌B名称（如：外婆家）"
                        value={formData.brandBName}
                        onChange={(e) => setFormData(prev => ({ ...prev, brandBName: e.target.value }))}
                        className="bg-input border-border flex-1"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground font-medium">周一</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs text-muted-foreground">午市%</Label>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              placeholder="午"
                              value={formData.brandBMonLunch}
                              onChange={(e) => setFormData(prev => ({ ...prev, brandBMonLunch: e.target.value }))}
                              className="bg-input border-border h-9"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">晚市%</Label>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              placeholder="晚"
                              value={formData.brandBMonDinner}
                              onChange={(e) => setFormData(prev => ({ ...prev, brandBMonDinner: e.target.value }))}
                              className="bg-input border-border h-9"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground font-medium">周五</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs text-muted-foreground">午市%</Label>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              placeholder="午"
                              value={formData.brandBFriLunch}
                              onChange={(e) => setFormData(prev => ({ ...prev, brandBFriLunch: e.target.value }))}
                              className="bg-input border-border h-9"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">晚市%</Label>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              placeholder="晚"
                              value={formData.brandBFriDinner}
                              onChange={(e) => setFormData(prev => ({ ...prev, brandBFriDinner: e.target.value }))}
                              className="bg-input border-border h-9"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground font-medium">周六</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs text-muted-foreground">午市%</Label>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              placeholder="午"
                              value={formData.brandBSatLunch}
                              onChange={(e) => setFormData(prev => ({ ...prev, brandBSatLunch: e.target.value }))}
                              className="bg-input border-border h-9"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">晚市%</Label>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              placeholder="晚"
                              value={formData.brandBSatDinner}
                              onChange={(e) => setFormData(prev => ({ ...prev, brandBSatDinner: e.target.value }))}
                              className="bg-input border-border h-9"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 品牌C市调 */}
                  <div className="space-y-4 p-4 rounded-lg bg-muted/30 border border-border">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[oklch(0.60_0.10_280)] flex items-center justify-center text-background font-bold text-sm">C</div>
                      <Input
                        placeholder="品牌C名称（如：麻辣诱惑）"
                        value={formData.brandCName}
                        onChange={(e) => setFormData(prev => ({ ...prev, brandCName: e.target.value }))}
                        className="bg-input border-border flex-1"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground font-medium">周一</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs text-muted-foreground">午市%</Label>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              placeholder="午"
                              value={formData.brandCMonLunch}
                              onChange={(e) => setFormData(prev => ({ ...prev, brandCMonLunch: e.target.value }))}
                              className="bg-input border-border h-9"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">晚市%</Label>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              placeholder="晚"
                              value={formData.brandCMonDinner}
                              onChange={(e) => setFormData(prev => ({ ...prev, brandCMonDinner: e.target.value }))}
                              className="bg-input border-border h-9"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground font-medium">周五</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs text-muted-foreground">午市%</Label>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              placeholder="午"
                              value={formData.brandCFriLunch}
                              onChange={(e) => setFormData(prev => ({ ...prev, brandCFriLunch: e.target.value }))}
                              className="bg-input border-border h-9"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">晚市%</Label>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              placeholder="晚"
                              value={formData.brandCFriDinner}
                              onChange={(e) => setFormData(prev => ({ ...prev, brandCFriDinner: e.target.value }))}
                              className="bg-input border-border h-9"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground font-medium">周六</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs text-muted-foreground">午市%</Label>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              placeholder="午"
                              value={formData.brandCSatLunch}
                              onChange={(e) => setFormData(prev => ({ ...prev, brandCSatLunch: e.target.value }))}
                              className="bg-input border-border h-9"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">晚市%</Label>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              placeholder="晚"
                              value={formData.brandCSatDinner}
                              onChange={(e) => setFormData(prev => ({ ...prev, brandCSatDinner: e.target.value }))}
                              className="bg-input border-border h-9"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground text-center">建议实地考察时分别观察周一、周五、周六的午市（11:30-13:30）和晚市（17:30-20:30）上座情况</p>
                </CardContent>
              </Card>

              {/* 周边环境 */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-foreground">周边环境</CardTitle>
                      <CardDescription>选择地点后可自动分析周边商业环境</CardDescription>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAnalyzeSurroundings}
                      disabled={isAnalyzing || !formData.latitude}
                      className="border-primary text-primary hover:bg-primary/10"
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          分析中...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          自动分析
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-foreground">1km常住人口</Label>
                      <Input
                        type="number"
                        placeholder="例如：50000"
                        value={formData.population1km}
                        onChange={(e) => setFormData(prev => ({ ...prev, population1km: e.target.value }))}
                        className="bg-input border-border"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground">3km常住人口</Label>
                      <Input
                        type="number"
                        placeholder="例如：200000"
                        value={formData.population3km}
                        onChange={(e) => setFormData(prev => ({ ...prev, population3km: e.target.value }))}
                        className="bg-input border-border"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-foreground">周边写字楼数量</Label>
                      <Input
                        type="number"
                        placeholder="例如：5"
                        value={formData.officeBuildings}
                        onChange={(e) => setFormData(prev => ({ ...prev, officeBuildings: e.target.value }))}
                        className="bg-input border-border"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground">工位估算</Label>
                      <Input
                        type="number"
                        placeholder="例如：10000"
                        value={formData.estimatedWorkstations}
                        onChange={(e) => setFormData(prev => ({ ...prev, estimatedWorkstations: e.target.value }))}
                        className="bg-input border-border"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-foreground">停车位数量</Label>
                    <Input
                      type="number"
                      placeholder="例如：500"
                      value={formData.parkingSpots}
                      onChange={(e) => setFormData(prev => ({ ...prev, parkingSpots: e.target.value }))}
                      className="bg-input border-border"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-foreground">主要年龄层</Label>
                      <Select
                        value={formData.ageGroup}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, ageGroup: value }))}
                      >
                        <SelectTrigger className="bg-input border-border">
                          <SelectValue placeholder="选择年龄层" />
                        </SelectTrigger>
                        <SelectContent>
                          {AGE_GROUPS.map(group => (
                            <SelectItem key={group} value={group}>{group}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground">消费能力</Label>
                      <Select
                        value={formData.consumptionLevel}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, consumptionLevel: value }))}
                      >
                        <SelectTrigger className="bg-input border-border">
                          <SelectValue placeholder="选择消费能力" />
                        </SelectTrigger>
                        <SelectContent>
                          {CONSUMPTION_LEVELS.map(level => (
                            <SelectItem key={level} value={level}>{level}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-foreground">周边环境描述</Label>
                    <Textarea
                      placeholder="描述周边2公里的商业环境，如商圈类型、主要业态、人流特点等"
                      value={formData.surroundingDesc}
                      onChange={(e) => setFormData(prev => ({ ...prev, surroundingDesc: e.target.value }))}
                      className="bg-input border-border min-h-[100px]"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 右侧：地图和评分 */}
            <div className="space-y-6">
              {/* 地图选点 */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">地图选点</CardTitle>
                  <CardDescription>输入地址搜索定位，或点击地图选择位置</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* 地址搜索框 */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="输入地址搜索，如：上海市静安区南京西路1788号"
                      value={searchAddress}
                      onChange={(e) => setSearchAddress(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddressSearch();
                        }
                      }}
                      className="bg-input border-border flex-1"
                    />
                    <Button
                      type="button"
                      onClick={handleAddressSearch}
                      disabled={isSearching}
                      className="gradient-accent text-background"
                    >
                      {isSearching ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Search className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  
                  <div className="h-[300px] rounded-lg overflow-hidden border border-border">
                    <MapView
                      onMapReady={handleMapReady}
                      initialCenter={mapCenter || { lat: 31.2304, lng: 121.4737 }}
                      initialZoom={14}
                    />
                  </div>
                  {formData.latitude && formData.longitude && (
                    <p className="text-sm text-muted-foreground">
                      坐标：{formData.latitude}, {formData.longitude}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* 评分输入 */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">选址评分</CardTitle>
                  <CardDescription>根据实地调研情况，为各维度打分（1-10分），点击问号查看详细打分标准</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {SCORE_DIMENSIONS.map((dimension) => {
                    const key = dimension.key as keyof typeof formData;
                    const value = formData[key] as number;
                    
                    return (
                      <div key={dimension.key} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Label className="text-foreground font-medium">{dimension.label}</Label>
                            <Tooltip>
                              <TooltipTrigger>
                                <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent side="right" className="max-w-[350px] p-3">
                                <div className="space-y-2">
                                  <p className="font-medium text-foreground">{dimension.label}评分标准</p>
                                  <p className="text-xs text-muted-foreground mb-2">{dimension.description}</p>
                                  <div className="space-y-1.5">
                                    {dimension.criteria.map((c, idx) => (
                                      <div key={idx} className="flex gap-2 text-xs">
                                        <span className="font-medium text-primary whitespace-nowrap">{c.score}</span>
                                        <span className="text-muted-foreground">{c.desc}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <span className="text-2xl font-bold text-primary">{value}</span>
                        </div>
                        <Slider
                          value={[value]}
                          onValueChange={([newValue]) => setFormData(prev => ({ ...prev, [key]: newValue }))}
                          min={1}
                          max={10}
                          step={1}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>差 (1-2)</span>
                          <span>一般 (5-6)</span>
                          <span>优秀 (9-10)</span>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* 提交按钮 */}
              <div className="flex gap-4">
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
                      评估中...
                    </>
                  ) : (
                    '生成评估报告'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
