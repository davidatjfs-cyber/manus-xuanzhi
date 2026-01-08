/**
 * Unified type exports
 * Import shared types from this single entry point.
 */

export type * from "../drizzle/schema";
export * from "./_core/errors";

// 餐厅类型选项
export const RESTAURANT_TYPES = [
  '中餐',
  '西餐',
  '快餐',
  '日料',
  '韩餐',
  '火锅',
  '烧烤',
  '咖啡茶饮',
  '其他',
] as const;

// 目标客群选项
export const TARGET_CUSTOMERS = [
  '白领',
  '学生',
  '家庭',
  '商务',
  '游客',
  '混合',
] as const;

// 餐厅规模选项
export const RESTAURANT_SCALES = [
  { value: '档口型', label: '档口型 (100㎡以下)', maxArea: 100 },
  { value: '小型', label: '小型 (100-150㎡)', maxArea: 150 },
  { value: '中型', label: '中型 (150-250㎡)', maxArea: 250 },
  { value: '大型', label: '大型 (250㎡以上)', maxArea: Infinity },
] as const;

// 经营模式选项
export const BUSINESS_MODELS = [
  { value: '快餐', label: '快餐 (高翻台率)', description: '客流量权重60%，租金权重30%，环境权重10%' },
  { value: '正餐', label: '正餐/聚餐 (环境优先)', description: '环境与停车位权重40%，周边社区成熟度30%，租金30%' },
  { value: '均衡', label: '均衡模式', description: '各维度均衡考量' },
] as const;

// 年龄层选项
export const AGE_GROUPS = [
  '18-25岁',
  '25-35岁',
  '35-45岁',
  '45-55岁',
  '55岁以上',
  '混合',
] as const;

// 消费能力选项
export const CONSUMPTION_LEVELS = [
  '低消费',
  '中等消费',
  '高消费',
  '混合',
] as const;

// 评分维度（包含详细的打1-10分打分标准）
export const SCORE_DIMENSIONS = [
  { 
    key: 'trafficScore', 
    label: '客流量', 
    description: '周边人流量、商圈活跃度',
    criteria: [
      { score: '1-2分', desc: '日均客流<500人，位置偏僻，无商业氛围' },
      { score: '3-4分', desc: '日均客流500-2000人，有一定人流但不稳定' },
      { score: '5-6分', desc: '日均客流2000-5000人，人流较稳定，有固定客群' },
      { score: '7-8分', desc: '日均客流5000-10000人，人流旺盛，商业氛围浓厚' },
      { score: '9-10分', desc: '日均客流>10000人，黄金地段，人流密集' },
    ]
  },
  { 
    key: 'locationScore', 
    label: '铺位条件', 
    description: '位置、门头、可达性',
    criteria: [
      { score: '1-2分', desc: '进深巷、需上台阶、门头<3米、无昇示性' },
      { score: '3-4分', desc: '次通道位置、门头宽度3-5米、可见度一般' },
      { score: '5-6分', desc: '主通道位置、门头宽度5-8米、无台阶、可见度较好' },
      { score: '7-8分', desc: '主通道转角位、门头>8米、昇示性强、无障碑' },
      { score: '9-10分', desc: '核心位置、独立店面、门头>10米、多面展示' },
    ]
  },
  { 
    key: 'customerMatchScore', 
    label: '客群匹配', 
    description: '目标客群与周边人群匹配度',
    criteria: [
      { score: '1-2分', desc: '周边人群与目标客群完全不匹配（如高端餐厅开在学生区）' },
      { score: '3-4分', desc: '匹配度<30%，目标客群占比低，需要引流' },
      { score: '5-6分', desc: '匹配度30-50%，有一定目标客群，但不是主流' },
      { score: '7-8分', desc: '匹配度50-70%，目标客群占主导，消费习惯匹配' },
      { score: '9-10分', desc: '匹配度>70%，目标客群高度集中，消费能力匹配' },
    ]
  },
  { 
    key: 'heatScore', 
    label: '区域热力', 
    description: '区域商业热度、发展潜力',
    criteria: [
      { score: '1-2分', desc: '新开发区、无成熟商业、人气冷淡' },
      { score: '3-4分', desc: '发展中区域、商业配套不完善、潜力待观察' },
      { score: '5-6分', desc: '成熟商圈边缘、有一定商业氛围、稳定发展' },
      { score: '7-8分', desc: '成熟商圈内、商业氛围浓厚、人气旺盛' },
      { score: '9-10分', desc: '核心商圈、地标性位置、人流密集、发展成熟' },
    ]
  },
  { 
    key: 'costScore', 
    label: '成本控制', 
    description: '租金、装修、运营成本',
    criteria: [
      { score: '1-2分', desc: '租金占预期营业额>25%，成本压力极大' },
      { score: '3-4分', desc: '租金占比20-25%，成本较高，盈利空间小' },
      { score: '5-6分', desc: '租金占比15-20%，成本可接受，有一定盈利空间' },
      { score: '7-8分', desc: '租金占比10-15%，成本合理，盈利空间较大' },
      { score: '9-10分', desc: '租金占比<10%，成本低，盈利空间充足' },
    ]
  },
  { 
    key: 'competitionScore', 
    label: '竞争环境', 
    description: '周边竞品数量、差异化空间',
    criteria: [
      { score: '1-2分', desc: '500米内>20家同类竞品，竞争激烈，差异化困难' },
      { score: '3-4分', desc: '500米内10-20家同类竞品，竞争较大，需要特色' },
      { score: '5-6分', desc: '500米内5-10家同类竞品，竞争适中，有差异化空间' },
      { score: '7-8分', desc: '500米内2-5家同类竞品，竞争较小，差异化明显' },
      { score: '9-10分', desc: '500米内<2家同类竞品或无竞品，市场空白' },
    ]
  },
] as const;

// 推荐等级
export const RECOMMENDATION_LEVELS = {
  recommended: { label: '推荐', color: 'green', minScore: 75 },
  cautious: { label: '谨慎考虑', color: 'yellow', minScore: 60 },
  notRecommended: { label: '不推荐', color: 'red', minScore: 0 },
} as const;

// 风险等级
export const RISK_LEVELS = {
  low: { label: '低风险', color: 'green' },
  medium: { label: '中等风险', color: 'yellow' },
  high: { label: '高风险', color: 'red' },
} as const;

// 铺位可视性选项
export const VISIBILITY_OPTIONS = [
  { value: 'excellent', label: '极佳', desc: '主通道转角位，多面展示，远距离可见' },
  { value: 'good', label: '良好', desc: '主通道位置，正面展示，较容易发现' },
  { value: 'fair', label: '一般', desc: '次通道位置，需要寻找才能发现' },
  { value: 'poor', label: '较差', desc: '位置隐蔽，容易被忽略' },
] as const;

// 楼层选项
export const FLOOR_LEVELS = [
  'B2', 'B1', '1F', '2F', '3F', '4F', '5F', '6F', '7F', '8F', '9F', '10F+'
] as const;

// 餐厅细分品类
export const RESTAURANT_SUB_CATEGORIES = {
  '中餐': ['粤菜', '川菜', '湘菜', '江浙菜', '东北菜', '鲁菜', '闽菜', '徽菜', '潮汕菜', '客家菜', '烧腊店', '其他中餐'],
  '火锅': ['川渝火锅', '潮汕牛肉火锅', '羊肉火锅', '港式火锅', '椰子鸡火锅', '其他火锅'],
  '日料': ['寿司', '拉面', '居酒屋', '烧肉', '日式简餐', '其他日料'],
  '韩餐': ['韩式烤肉', '石锅拌饭', '部队锅', '其他韩餐'],
  '西餐': ['意式', '法式', '美式', '西班牙', '其他西餐'],
  '快餐': ['中式快餐', '汉堡', '披萨', '粉面', '麻辣烫', '其他快餐'],
  '烧烤': ['串串', '烤肉', '烤鱼', '其他烧烤'],
  '咖啡茶饮': ['咖啡厅', '茶饮店', '甜品店', '其他'],
  '其他': ['其他'],
} as const;

// 竞争饱和度等级
export const COMPETITION_SATURATION_LEVELS = {
  low: { label: '蓝海', color: 'blue', maxCount: 2, desc: '竞争小，市场空白' },
  medium: { label: '正常', color: 'green', maxCount: 5, desc: '竞争适中，有差异化空间' },
  high: { label: '红海', color: 'orange', maxCount: 10, desc: '竞争较大，需要特色' },
  saturated: { label: '过饱和', color: 'red', maxCount: Infinity, desc: '竞争激烈，建议谨慎' },
} as const;

// POI类型
export const POI_TYPES = [
  { key: 'offices', label: '写字楼', icon: 'Building2' },
  { key: 'malls', label: '商场', icon: 'ShoppingBag' },
  { key: 'cinemas', label: '电影院', icon: 'Film' },
  { key: 'subways', label: '地铁站', icon: 'Train' },
  { key: 'busStops', label: '公交站', icon: 'Bus' },
  { key: 'schools', label: '学校', icon: 'GraduationCap' },
  { key: 'hospitals', label: '医院', icon: 'Hospital' },
] as const;
