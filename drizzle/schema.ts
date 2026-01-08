import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * 餐厅基本信息表
 */
export const restaurants = mysqlTable("restaurants", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  // 餐厅类型：中餐/西餐/快餐/日料/韩餐/火锅/烧烤/咖啡茶饮/其他
  type: varchar("type", { length: 64 }).notNull(),
  // 餐厅细分品类（如：潮汕菜、粤菜、烧腊店等）
  subCategory: varchar("subCategory", { length: 64 }),
  // 客单价范围（元）
  priceRangeMin: int("priceRangeMin").notNull(),
  priceRangeMax: int("priceRangeMax").notNull(),
  // 主要目标客群：白领/学生/家庭/商务/游客/混合
  targetCustomer: varchar("targetCustomer", { length: 64 }).notNull(),
  // 餐厅规模：小型(50㎡以下)/中型(50-150㎡)/大型(150-300㎡)/超大型(300㎡以上)
  scale: varchar("scale", { length: 64 }).notNull(),
  // 经营模式：快餐/正餐/聚餐
  businessModel: varchar("businessModel", { length: 64 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Restaurant = typeof restaurants.$inferSelect;
export type InsertRestaurant = typeof restaurants.$inferInsert;

/**
 * 选址评估表 - 重构版
 * 分为三大模块：数据中心、现场勘察、财务测算
 */
export const siteEvaluations = mysqlTable("siteEvaluations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  restaurantId: int("restaurantId").notNull(),
  
  // ========== 基本信息 ==========
  address: text("address").notNull(),
  mallName: varchar("mallName", { length: 255 }), // 商场/商铺名称
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  area: int("area").notNull(), // 铺位面积（㎡）
  monthlyRent: int("monthlyRent").notNull(), // 月租金（元）
  
  // ========== 一、数据中心（系统自动获取） ==========
  
  // 1. 热力图数据
  // 客流热力 - 分时段人流数据（JSON存储）
  trafficHeatmap: json("trafficHeatmap"), // { weekday: { morning, lunch, dinner }, weekend: { morning, lunch, dinner } }
  // 每周1-7天各时段客流量（JSON存储）
  weeklyTraffic: json("weeklyTraffic"), // { mon: {...}, tue: {...}, ... }
  // 房价/租金热力
  avgRentPerSqm: int("avgRentPerSqm"), // 区域平均租金（元/㎡/月）
  avgHousePrice: int("avgHousePrice"), // 区域平均房价（元/㎡）
  consumptionIndex: int("consumptionIndex"), // 区域消费力指数（1-100）
  
  // 2. 个性化区域分析
  nearbyPremiumOffices: json("nearbyPremiumOffices"), // 高档写字楼列表 [{ name, distance, workstations }]
  nearbyResidentialAreas: json("nearbyResidentialAreas"), // 大型居住区 [{ name, distance, households }]
  nearbyMalls: json("nearbyMalls"), // 周边商场 [{ name, distance, level }]
  
  // 3. POI聚类分析（500米范围）
  poi500mOffices: int("poi500mOffices"), // 写字楼数量
  poi500mMalls: int("poi500mMalls"), // 商场数量
  poi500mCinemas: int("poi500mCinemas"), // 电影院数量
  poi500mSubways: int("poi500mSubways"), // 地铁站数量
  poi500mBusStops: int("poi500mBusStops"), // 公交站数量
  poi500mSchools: int("poi500mSchools"), // 学校数量
  poi500mHospitals: int("poi500mHospitals"), // 医院数量
  
  // 4. 竞对分布
  competitorList: json("competitorList"), // 竞对列表 [{ name, category, distance, priceRange }]
  manualCompetitors: json("manualCompetitors"), // 手动输入的竞对列表 [{ name, category, distance, priceRange }]
  sameCategoryCount: int("sameCategoryCount"), // 同品类餐厅数量
  competitionSaturationIndex: int("competitionSaturationIndex"), // 竞争饱和度指数（1-100）
  isRedOcean: int("isRedOcean").default(0), // 是否红海区域 0/1
  
  // ========== 二、现场勘察（手动填写） ==========
  
  // 1. 铺位情况
  // 可视性
  visibility: mysqlEnum("visibility", ["excellent", "good", "fair", "poor"]), // 铺位可视性
  isBlocked: int("isBlocked").default(0), // 是否被遮挡 0/1
  blockingDesc: text("blockingDesc"), // 遮挡情况描述
  
  // 通达性
  floorLevel: varchar("floorLevel", { length: 32 }), // 楼层（B1/1F/2F等）
  isMainDiningFloor: int("isMainDiningFloor").default(0), // 是否主餐饮层 0/1
  nearEscalator: int("nearEscalator").default(0), // 是否扶梯旁 0/1
  isMiddleOfFloor: int("isMiddleOfFloor").default(0), // 是否楼层中间位置 0/1
  nearPopularBrand: int("nearPopularBrand").default(0), // 是否热门品牌旁 0/1
  nearPopularBrandName: varchar("nearPopularBrandName", { length: 128 }), // 旁边热门品牌名称
  
  // 房型缺陷
  hasShapeDefect: int("hasShapeDefect").default(0), // 房型是否有缺陷 0/1
  shapeDefectDesc: text("shapeDefectDesc"), // 房型缺陷描述
  
  // 工程条件缺陷
  hasEngineeringDefect: int("hasEngineeringDefect").default(0), // 工程条件是否有缺陷 0/1
  engineeringDefectDesc: text("engineeringDefectDesc"), // 工程条件缺陷描述
  
  // 原有铺位字段保留兼容
  isMainCorridor: int("isMainCorridor").default(0), // 是否在主通道 0/1
  storefrontWidth: decimal("storefrontWidth", { precision: 5, scale: 2 }), // 门头宽度（米）
  hasStairs: int("hasStairs").default(0), // 是否需要上台阶 0/1
  hasDeepAlley: int("hasDeepAlley").default(0), // 是否进深巷 0/1
  
  // 2. 客流量市调（3个品牌，至少3天，早/中/晚）
  // 品牌A市调数据（不同客单价）
  brandAName: varchar("brandAName", { length: 128 }),
  brandAPriceRange: varchar("brandAPriceRange", { length: 32 }), // 客单价区间
  brandAMonLunch: int("brandAMonLunch"),
  brandAMonDinner: int("brandAMonDinner"),
  brandAFriLunch: int("brandAFriLunch"),
  brandAFriDinner: int("brandAFriDinner"),
  brandASatLunch: int("brandASatLunch"),
  brandASatDinner: int("brandASatDinner"),
  // 品牌B市调数据
  brandBName: varchar("brandBName", { length: 128 }),
  brandBPriceRange: varchar("brandBPriceRange", { length: 32 }),
  brandBMonLunch: int("brandBMonLunch"),
  brandBMonDinner: int("brandBMonDinner"),
  brandBFriLunch: int("brandBFriLunch"),
  brandBFriDinner: int("brandBFriDinner"),
  brandBSatLunch: int("brandBSatLunch"),
  brandBSatDinner: int("brandBSatDinner"),
  // 品牌C市调数据
  brandCName: varchar("brandCName", { length: 128 }),
  brandCPriceRange: varchar("brandCPriceRange", { length: 32 }),
  brandCMonLunch: int("brandCMonLunch"),
  brandCMonDinner: int("brandCMonDinner"),
  brandCFriLunch: int("brandCFriLunch"),
  brandCFriDinner: int("brandCFriDinner"),
  brandCSatLunch: int("brandCSatLunch"),
  brandCSatDinner: int("brandCSatDinner"),
  
  // 3. 商场其他品牌业绩参考（3个品牌）
  refBrand1Name: varchar("refBrand1Name", { length: 128 }),
  refBrand1Category: varchar("refBrand1Category", { length: 64 }), // 品类
  refBrand1MonthlyRevenue: int("refBrand1MonthlyRevenue"), // 月营业额
  refBrand1DailyTurnover: decimal("refBrand1DailyTurnover", { precision: 5, scale: 2 }), // 日翻台率
  refBrand1Remark: text("refBrand1Remark"), // 备注
  
  refBrand2Name: varchar("refBrand2Name", { length: 128 }),
  refBrand2Category: varchar("refBrand2Category", { length: 64 }),
  refBrand2MonthlyRevenue: int("refBrand2MonthlyRevenue"),
  refBrand2DailyTurnover: decimal("refBrand2DailyTurnover", { precision: 5, scale: 2 }),
  refBrand2Remark: text("refBrand2Remark"),
  
  refBrand3Name: varchar("refBrand3Name", { length: 128 }),
  refBrand3Category: varchar("refBrand3Category", { length: 64 }),
  refBrand3MonthlyRevenue: int("refBrand3MonthlyRevenue"),
  refBrand3DailyTurnover: decimal("refBrand3DailyTurnover", { precision: 5, scale: 2 }),
  refBrand3Remark: text("refBrand3Remark"),
  
  // 周边环境描述（保留）
  surroundingDesc: text("surroundingDesc"),
  population1km: int("population1km"),
  population3km: int("population3km"),
  officeBuildings: int("officeBuildings"),
  estimatedWorkstations: int("estimatedWorkstations"),
  parkingSpots: int("parkingSpots"),
  ageGroup: varchar("ageGroup", { length: 64 }),
  consumptionLevel: varchar("consumptionLevel", { length: 64 }),
  
  // ========== 三、评分 ==========
  
  // 手动评分（1-10分）
  trafficScore: int("trafficScore"), // 客流量评分
  locationScore: int("locationScore"), // 铺位条件评分
  customerMatchScore: int("customerMatchScore"), // 目标客群匹配度评分
  costScore: int("costScore"), // 成本评分
  competitionScore: int("competitionScore"), // 竞争评分
  
  // 系统自动评分
  heatScore: int("heatScore"), // 区域热力评分（系统自动）
  dataScore: int("dataScore"), // 数据中心评分（系统自动）
  surveyScore: int("surveyScore"), // 现场勘察评分（系统自动）
  financialScore: int("financialScore"), // 财务健康评分（系统自动）
  
  // 综合得分
  totalScore: decimal("totalScore", { precision: 5, scale: 2 }),
  recommendation: varchar("recommendation", { length: 32 }),
  
  // LLM分析结果
  llmAnalysis: text("llmAnalysis"),
  
  // ========== 四、财务测算（增强版） ==========
  
  // 盈亏平衡计算（保留）
  breakEvenRevenue: decimal("breakEvenRevenue", { precision: 12, scale: 2 }),
  breakEvenTurnover: decimal("breakEvenTurnover", { precision: 5, scale: 2 }),
  financialRisk: varchar("financialRisk", { length: 32 }),
  
  // 新增：预计营收和投资
  estimatedMonthlyRevenue: int("estimatedMonthlyRevenue"), // 预计月营收
  estimatedInvestment: int("estimatedInvestment"), // 预计总投资
  paybackPeriod: int("paybackPeriod"), // 回本周期（月）
  monthlyProfit: int("monthlyProfit"), // 预计月利润
  roi: decimal("roi", { precision: 5, scale: 2 }), // 投资回报率(%)
  
  // 旧字段保留兼容
  hasSameCategory: int("hasSameCategory").default(0),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SiteEvaluation = typeof siteEvaluations.$inferSelect;
export type InsertSiteEvaluation = typeof siteEvaluations.$inferInsert;

/**
 * 评分权重配置表
 */
export const scoringConfigs = mysqlTable("scoringConfigs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  businessModel: varchar("businessModel", { length: 64 }).notNull(),
  
  // 权重配置（百分比，总和100）
  trafficWeight: int("trafficWeight").notNull().default(20),
  locationWeight: int("locationWeight").notNull().default(20),
  customerMatchWeight: int("customerMatchWeight").notNull().default(20),
  heatWeight: int("heatWeight").notNull().default(15),
  costWeight: int("costWeight").notNull().default(15),
  competitionWeight: int("competitionWeight").notNull().default(10),
  
  isDefault: int("isDefault").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ScoringConfig = typeof scoringConfigs.$inferSelect;
export type InsertScoringConfig = typeof scoringConfigs.$inferInsert;

/**
 * 财务测算表（增强版）
 */
export const financialCalculations = mysqlTable("financialCalculations", {
  id: int("id").autoincrement().primaryKey(),
  evaluationId: int("evaluationId").notNull(),
  
  // 基础输入参数
  estimatedPrice: int("estimatedPrice").notNull(), // 预估客单价
  grossMarginRate: decimal("grossMarginRate", { precision: 5, scale: 2 }).notNull(), // 预估毛利率(%)
  monthlyRent: int("monthlyRent").notNull(), // 月租金
  monthlyLabor: int("monthlyLabor").notNull(), // 月人工成本
  otherCosts: int("otherCosts").default(0), // 其他月成本
  seats: int("seats").notNull(), // 座位数
  
  // 新增：预计营收和投资
  estimatedMonthlyRevenue: int("estimatedMonthlyRevenue"), // 预计月营收
  estimatedInvestment: int("estimatedInvestment"), // 预计总投资（装修+设备+首批物料+押金等）
  decorationCost: int("decorationCost"), // 装修费用
  equipmentCost: int("equipmentCost"), // 设备费用
  initialInventory: int("initialInventory"), // 首批物料
  deposit: int("deposit"), // 押金
  otherInvestment: int("otherInvestment"), // 其他投资
  
  // 计算结果
  dailyBreakEven: decimal("dailyBreakEven", { precision: 12, scale: 2 }), // 日保本营业额
  dailyTurnover: decimal("dailyTurnover", { precision: 5, scale: 2 }), // 日保本翻台率
  industryAvgTurnover: decimal("industryAvgTurnover", { precision: 5, scale: 2 }), // 行业平均翻台率
  riskLevel: varchar("riskLevel", { length: 32 }), // 风险等级
  
  // 新增：回本周期计算
  monthlyProfit: int("monthlyProfit"), // 月利润
  paybackPeriod: int("paybackPeriod"), // 回本周期（月）
  annualROI: decimal("annualROI", { precision: 5, scale: 2 }), // 年投资回报率(%)
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FinancialCalculation = typeof financialCalculations.$inferSelect;
export type InsertFinancialCalculation = typeof financialCalculations.$inferInsert;
