/**
 * 数据中心服务模块
 * 提供热力图、POI分析、竞对分布等数据获取功能
 * 使用Google Places API获取真实周边餐厅数据
 */

import { invokeLLM } from "./_core/llm";
import { makeRequest, PlacesSearchResult } from "./_core/map";

// POI数据类型
export interface POIData {
  offices: number;
  malls: number;
  cinemas: number;
  subways: number;
  busStops: number;
  schools: number;
  hospitals: number;
}

// 竞对信息
export interface CompetitorInfo {
  name: string;
  category: string;
  subCategory: string;
  distance: number; // 米
  priceRange: string;
}

// 周边设施信息
export interface NearbyFacility {
  name: string;
  distance: number; // 米
  type: string;
  level?: string; // 商场等级
  workstations?: number; // 写字楼工位数
  households?: number; // 居住区户数
}

// 热力图数据
export interface TrafficHeatmapData {
  weekday: {
    morning: number; // 早高峰人流指数 (0-100)
    lunch: number; // 午餐高峰
    dinner: number; // 晚餐高峰
  };
  weekend: {
    morning: number;
    lunch: number;
    dinner: number;
  };
}

// 每周客流数据
export interface WeeklyTrafficData {
  [day: string]: {
    morning: number;
    lunch: number;
    dinner: number;
    total: number;
  };
}

// 数据中心分析结果
export interface DataCenterAnalysis {
  // 热力图数据
  trafficHeatmap: TrafficHeatmapData;
  weeklyTraffic: WeeklyTrafficData;
  avgRentPerSqm: number;
  avgHousePrice: number;
  consumptionIndex: number;
  
  // POI数据
  poi500m: POIData;
  
  // 周边设施
  nearbyPremiumOffices: NearbyFacility[];
  nearbyResidentialAreas: NearbyFacility[];
  nearbyMalls: NearbyFacility[];
  
  // 竞对分析
  competitors: CompetitorInfo[];
  sameCategoryCount: number;
  competitionSaturationIndex: number;
  isRedOcean: boolean;
  
  // 区域热力评分
  heatScore: number;
  
  // 分析说明
  reasoning: string;
}

/**
 * 计算两点之间的距离（米）
 */
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // 地球半径（米）
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * 根据评分估算价格区间
 */
function estimatePriceRange(rating?: number): string {
  if (!rating) return '中';
  if (rating >= 4.5) return '高';
  if (rating >= 4.0) return '中高';
  if (rating >= 3.5) return '中';
  return '中低';
}

/**
 * 根据餐厅名称和类型推断细分品类
 */
function inferSubCategory(name: string, types: string[]): string {
  const nameLower = name.toLowerCase();
  
  // 粤菜相关
  if (nameLower.includes('粤') || nameLower.includes('广东') || nameLower.includes('港式') || 
      nameLower.includes('茶餐厅') || nameLower.includes('点心') || nameLower.includes('早茶')) {
    return '粤菜';
  }
  // 潮汕菜
  if (nameLower.includes('潮汕') || nameLower.includes('潮州') || nameLower.includes('汕头') || 
      nameLower.includes('牛肉火锅') || nameLower.includes('牛肉丸')) {
    return '潮汕菜';
  }
  // 川菜
  if (nameLower.includes('川') || nameLower.includes('四川') || nameLower.includes('成都') || 
      nameLower.includes('重庆') || nameLower.includes('麻辣')) {
    return '川菜';
  }
  // 湘菜
  if (nameLower.includes('湘') || nameLower.includes('湖南') || nameLower.includes('长沙')) {
    return '湘菜';
  }
  // 本帮菜/上海菜
  if (nameLower.includes('本帮') || nameLower.includes('上海') || nameLower.includes('沪')) {
    return '本帮菜';
  }
  // 江浙菜
  if (nameLower.includes('江浙') || nameLower.includes('杭州') || nameLower.includes('苏州') || 
      nameLower.includes('宁波') || nameLower.includes('绍兴')) {
    return '江浙菜';
  }
  // 火锅
  if (nameLower.includes('火锅') || nameLower.includes('hotpot')) {
    return '火锅';
  }
  // 烧烤
  if (nameLower.includes('烧烤') || nameLower.includes('烤肉') || nameLower.includes('串串')) {
    return '烧烤';
  }
  // 日料
  if (nameLower.includes('日本') || nameLower.includes('日式') || nameLower.includes('寿司') || 
      nameLower.includes('拉面') || nameLower.includes('居酒屋')) {
    return '日料';
  }
  // 韩餐
  if (nameLower.includes('韩国') || nameLower.includes('韩式') || nameLower.includes('烤肉')) {
    return '韩餐';
  }
  // 西餐
  if (nameLower.includes('西餐') || nameLower.includes('牛排') || nameLower.includes('意大利') || 
      nameLower.includes('法国') || nameLower.includes('披萨')) {
    return '西餐';
  }
  // 海鲜
  if (nameLower.includes('海鲜') || nameLower.includes('seafood')) {
    return '海鲜';
  }
  
  return '中餐';
}

/**
 * 使用Google Places API搜索周边餐厅
 */
async function searchNearbyRestaurants(
  latitude: number,
  longitude: number,
  radius: number = 1500,
  keyword?: string
): Promise<CompetitorInfo[]> {
  try {
    // 使用nearby search API搜索餐厅
    const result = await makeRequest<PlacesSearchResult>(
      '/maps/api/place/nearbysearch/json',
      {
        location: `${latitude},${longitude}`,
        radius: radius,
        type: 'restaurant',
        keyword: keyword || '餐厅',
        language: 'zh-CN',
      }
    );

    if (result.status !== 'OK' || !result.results) {
      console.log('Places API返回状态:', result.status);
      return [];
    }

    // 转换为竞对信息格式
    const competitors: CompetitorInfo[] = result.results.map(place => {
      const distance = calculateDistance(
        latitude, longitude,
        place.geometry.location.lat, place.geometry.location.lng
      );
      
      return {
        name: place.name,
        category: '中餐', // 默认分类
        subCategory: inferSubCategory(place.name, place.types || []),
        distance: distance,
        priceRange: estimatePriceRange(place.rating),
      };
    });

    // 按距离排序
    return competitors.sort((a, b) => a.distance - b.distance);
  } catch (error) {
    console.error('搜索周边餐厅失败:', error);
    return [];
  }
}

/**
 * 搜索特定品类的餐厅
 */
async function searchCategoryRestaurants(
  latitude: number,
  longitude: number,
  category: string,
  subCategory?: string
): Promise<CompetitorInfo[]> {
  const searchKeywords: string[] = [];
  
  // 根据品类构建搜索关键词
  if (subCategory) {
    searchKeywords.push(subCategory);
  }
  if (category) {
    searchKeywords.push(category);
  }
  
  // 添加相关关键词
  const categoryKeywords: Record<string, string[]> = {
    '粤菜': ['粤菜', '广东菜', '港式', '茶餐厅', '点心'],
    '潮汕菜': ['潮汕', '潮州菜', '牛肉火锅', '潮汕牛肉'],
    '川菜': ['川菜', '四川菜', '麻辣'],
    '湘菜': ['湘菜', '湖南菜'],
    '本帮菜': ['本帮菜', '上海菜', '沪菜'],
    '江浙菜': ['江浙菜', '杭帮菜', '苏帮菜'],
    '火锅': ['火锅', '涮锅'],
    '日料': ['日本料理', '日式', '寿司'],
    '韩餐': ['韩国料理', '韩式', '烤肉'],
    '西餐': ['西餐', '牛排', '意大利菜'],
    '海鲜': ['海鲜', '海鲜酒楼'],
    '烧烤': ['烧烤', '烤肉', '串串'],
  };
  
  const keywords = categoryKeywords[subCategory || ''] || categoryKeywords[category] || ['餐厅'];
  
  // 搜索多个关键词并合并结果
  const allResults: CompetitorInfo[] = [];
  const seenNames = new Set<string>();
  
  for (const keyword of keywords.slice(0, 2)) { // 限制搜索次数
    try {
      const results = await searchNearbyRestaurants(latitude, longitude, 1500, keyword);
      for (const r of results) {
        if (!seenNames.has(r.name)) {
          seenNames.add(r.name);
          allResults.push(r);
        }
      }
    } catch (e) {
      console.error(`搜索关键词 ${keyword} 失败:`, e);
    }
  }
  
  return allResults.sort((a, b) => a.distance - b.distance);
}

/**
 * 基于地址和餐厅类型获取数据中心分析
 */
export async function analyzeDataCenter(params: {
  address: string;
  latitude?: number;
  longitude?: number;
  restaurantType: string;
  subCategory?: string;
  mallName?: string;
}): Promise<DataCenterAnalysis> {
  const { address, latitude, longitude, restaurantType, subCategory, mallName } = params;

  // 如果有坐标，使用Google Places API获取真实周边餐厅数据
  let realCompetitors: CompetitorInfo[] = [];
  if (latitude && longitude) {
    try {
      realCompetitors = await searchCategoryRestaurants(
        latitude, 
        longitude, 
        restaurantType, 
        subCategory
      );
      console.log(`从Google Places API获取到 ${realCompetitors.length} 家周边餐厅`);
    } catch (error) {
      console.error('获取周边餐厅数据失败:', error);
    }
  }

  // 计算同品类餐厅数量（500米内）
  const sameCategoryCompetitors = realCompetitors.filter(c => {
    const isSameCategory = subCategory 
      ? c.subCategory === subCategory || c.subCategory === restaurantType
      : c.category === restaurantType || c.subCategory === restaurantType;
    return c.distance <= 500 && isSameCategory;
  });
  const sameCategoryCount = sameCategoryCompetitors.length;
  
  // 计算竞争饱和度指数
  const competitionSaturationIndex = Math.min(100, sameCategoryCount * 15 + realCompetitors.filter(c => c.distance <= 500).length * 3);
  const isRedOcean = sameCategoryCount >= 5 || competitionSaturationIndex >= 80;

  // 使用LLM分析其他数据（热力图、POI等）
  const prompt = `你是一位专业的商业地产分析师，请根据以下位置信息，分析该区域的商业数据。

## 位置信息
- 地址：${address}
- 商场/商铺：${mallName || '未知'}
- 坐标：${latitude || '未知'}, ${longitude || '未知'}
- 计划开设餐厅类型：${restaurantType}
- 细分品类：${subCategory || '未知'}

## 已获取的真实周边餐厅数据
${realCompetitors.length > 0 ? realCompetitors.slice(0, 10).map(c => `- ${c.name} (${c.subCategory}) - ${c.distance}米`).join('\n') : '暂无数据'}

请分析以下内容并以JSON格式返回：

1. **客流热力数据**：估算该区域工作日和周末的早/中/晚高峰人流指数(0-100)
2. **每周客流分布**：估算周一到周日各时段的客流量指数
3. **区域消费力**：估算平均租金、房价和消费力指数
4. **POI分析**：估算500米范围内的写字楼、商场、电影院、地铁站、公交站、学校、医院数量
5. **周边设施**：列出主要的高档写字楼、大型居住区、商场（包含距离和规模）
6. **区域热力评分**：给出1-10分的区域热力评分

请基于地址的实际商业环境进行合理估算。`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: "你是一位经验丰富的商业地产分析师，擅长分析选址数据。请用中文回复，返回JSON格式数据。" },
      { role: "user", content: prompt },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "data_center_analysis",
        strict: true,
        schema: {
          type: "object",
          properties: {
            trafficHeatmap: {
              type: "object",
              properties: {
                weekday: {
                  type: "object",
                  properties: {
                    morning: { type: "number", description: "工作日早高峰人流指数(0-100)" },
                    lunch: { type: "number", description: "工作日午餐高峰人流指数" },
                    dinner: { type: "number", description: "工作日晚餐高峰人流指数" },
                  },
                  required: ["morning", "lunch", "dinner"],
                  additionalProperties: false,
                },
                weekend: {
                  type: "object",
                  properties: {
                    morning: { type: "number", description: "周末早高峰人流指数" },
                    lunch: { type: "number", description: "周末午餐高峰人流指数" },
                    dinner: { type: "number", description: "周末晚餐高峰人流指数" },
                  },
                  required: ["morning", "lunch", "dinner"],
                  additionalProperties: false,
                },
              },
              required: ["weekday", "weekend"],
              additionalProperties: false,
            },
            weeklyTraffic: {
              type: "object",
              properties: {
                mon: { type: "object", properties: { morning: { type: "number" }, lunch: { type: "number" }, dinner: { type: "number" }, total: { type: "number" } }, required: ["morning", "lunch", "dinner", "total"], additionalProperties: false },
                tue: { type: "object", properties: { morning: { type: "number" }, lunch: { type: "number" }, dinner: { type: "number" }, total: { type: "number" } }, required: ["morning", "lunch", "dinner", "total"], additionalProperties: false },
                wed: { type: "object", properties: { morning: { type: "number" }, lunch: { type: "number" }, dinner: { type: "number" }, total: { type: "number" } }, required: ["morning", "lunch", "dinner", "total"], additionalProperties: false },
                thu: { type: "object", properties: { morning: { type: "number" }, lunch: { type: "number" }, dinner: { type: "number" }, total: { type: "number" } }, required: ["morning", "lunch", "dinner", "total"], additionalProperties: false },
                fri: { type: "object", properties: { morning: { type: "number" }, lunch: { type: "number" }, dinner: { type: "number" }, total: { type: "number" } }, required: ["morning", "lunch", "dinner", "total"], additionalProperties: false },
                sat: { type: "object", properties: { morning: { type: "number" }, lunch: { type: "number" }, dinner: { type: "number" }, total: { type: "number" } }, required: ["morning", "lunch", "dinner", "total"], additionalProperties: false },
                sun: { type: "object", properties: { morning: { type: "number" }, lunch: { type: "number" }, dinner: { type: "number" }, total: { type: "number" } }, required: ["morning", "lunch", "dinner", "total"], additionalProperties: false },
              },
              required: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
              additionalProperties: false,
            },
            avgRentPerSqm: { type: "number", description: "区域平均租金（元/㎡/月）" },
            avgHousePrice: { type: "number", description: "区域平均房价（元/㎡）" },
            consumptionIndex: { type: "number", description: "区域消费力指数(1-100)" },
            poi500m: {
              type: "object",
              properties: {
                offices: { type: "number", description: "500米内写字楼数量" },
                malls: { type: "number", description: "500米内商场数量" },
                cinemas: { type: "number", description: "500米内电影院数量" },
                subways: { type: "number", description: "500米内地铁站数量" },
                busStops: { type: "number", description: "500米内公交站数量" },
                schools: { type: "number", description: "500米内学校数量" },
                hospitals: { type: "number", description: "500米内医院数量" },
              },
              required: ["offices", "malls", "cinemas", "subways", "busStops", "schools", "hospitals"],
              additionalProperties: false,
            },
            nearbyPremiumOffices: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  distance: { type: "number" },
                  workstations: { type: "number" },
                },
                required: ["name", "distance", "workstations"],
                additionalProperties: false,
              },
            },
            nearbyResidentialAreas: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  distance: { type: "number" },
                  households: { type: "number" },
                },
                required: ["name", "distance", "households"],
                additionalProperties: false,
              },
            },
            nearbyMalls: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  distance: { type: "number" },
                  level: { type: "string" },
                },
                required: ["name", "distance", "level"],
                additionalProperties: false,
              },
            },
            heatScore: { type: "number", description: "区域热力评分(1-10)" },
            reasoning: { type: "string", description: "分析说明" },
          },
          required: [
            "trafficHeatmap", "weeklyTraffic", "avgRentPerSqm", "avgHousePrice", "consumptionIndex",
            "poi500m", "nearbyPremiumOffices", "nearbyResidentialAreas", "nearbyMalls",
            "heatScore", "reasoning"
          ],
          additionalProperties: false,
        },
      },
    },
  });

  const rawContent = response.choices[0]?.message?.content;
  const contentStr = typeof rawContent === 'string' ? rawContent : (rawContent?.[0] && 'text' in rawContent[0] ? rawContent[0].text : "{}");
  
  try {
    const result = JSON.parse(contentStr);
    return {
      trafficHeatmap: result.trafficHeatmap || getDefaultTrafficHeatmap(),
      weeklyTraffic: result.weeklyTraffic || getDefaultWeeklyTraffic(),
      avgRentPerSqm: result.avgRentPerSqm || 300,
      avgHousePrice: result.avgHousePrice || 50000,
      consumptionIndex: result.consumptionIndex || 50,
      poi500m: result.poi500m || getDefaultPOI(),
      nearbyPremiumOffices: result.nearbyPremiumOffices || [],
      nearbyResidentialAreas: result.nearbyResidentialAreas || [],
      nearbyMalls: result.nearbyMalls || [],
      // 使用真实的Google Places API数据
      competitors: realCompetitors.slice(0, 15), // 最多返回15家
      sameCategoryCount: sameCategoryCount,
      competitionSaturationIndex: competitionSaturationIndex,
      isRedOcean: isRedOcean,
      heatScore: result.heatScore || 5,
      reasoning: result.reasoning || "基于地址位置的智能分析",
    };
  } catch {
    // 返回默认值，但使用真实的竞对数据
    return {
      ...getDefaultDataCenterAnalysis(),
      competitors: realCompetitors.slice(0, 15),
      sameCategoryCount: sameCategoryCount,
      competitionSaturationIndex: competitionSaturationIndex,
      isRedOcean: isRedOcean,
    };
  }
}

// 默认热力图数据
function getDefaultTrafficHeatmap(): TrafficHeatmapData {
  return {
    weekday: { morning: 40, lunch: 70, dinner: 60 },
    weekend: { morning: 30, lunch: 80, dinner: 75 },
  };
}

// 默认每周客流数据
function getDefaultWeeklyTraffic(): WeeklyTrafficData {
  return {
    mon: { morning: 40, lunch: 65, dinner: 55, total: 160 },
    tue: { morning: 42, lunch: 68, dinner: 58, total: 168 },
    wed: { morning: 45, lunch: 70, dinner: 60, total: 175 },
    thu: { morning: 43, lunch: 68, dinner: 58, total: 169 },
    fri: { morning: 45, lunch: 75, dinner: 70, total: 190 },
    sat: { morning: 35, lunch: 85, dinner: 80, total: 200 },
    sun: { morning: 30, lunch: 80, dinner: 70, total: 180 },
  };
}

// 默认POI数据
function getDefaultPOI(): POIData {
  return {
    offices: 5,
    malls: 2,
    cinemas: 1,
    subways: 1,
    busStops: 5,
    schools: 2,
    hospitals: 1,
  };
}

// 默认数据中心分析结果
function getDefaultDataCenterAnalysis(): DataCenterAnalysis {
  return {
    trafficHeatmap: getDefaultTrafficHeatmap(),
    weeklyTraffic: getDefaultWeeklyTraffic(),
    avgRentPerSqm: 300,
    avgHousePrice: 50000,
    consumptionIndex: 50,
    poi500m: getDefaultPOI(),
    nearbyPremiumOffices: [],
    nearbyResidentialAreas: [],
    nearbyMalls: [],
    competitors: [],
    sameCategoryCount: 0,
    competitionSaturationIndex: 30,
    isRedOcean: false,
    heatScore: 5,
    reasoning: "基于地址位置的默认估算",
  };
}

/**
 * 计算竞争饱和度等级
 */
export function getCompetitionLevel(sameCategoryCount: number): {
  level: 'low' | 'medium' | 'high' | 'saturated';
  label: string;
  color: string;
  desc: string;
} {
  if (sameCategoryCount <= 2) {
    return { level: 'low', label: '蓝海', color: 'blue', desc: '竞争小，市场空白' };
  } else if (sameCategoryCount <= 5) {
    return { level: 'medium', label: '正常', color: 'green', desc: '竞争适中，有差异化空间' };
  } else if (sameCategoryCount <= 10) {
    return { level: 'high', label: '红海', color: 'orange', desc: '竞争较大，需要特色' };
  } else {
    return { level: 'saturated', label: '过饱和', color: 'red', desc: '竞争激烈，建议谨慎' };
  }
}
