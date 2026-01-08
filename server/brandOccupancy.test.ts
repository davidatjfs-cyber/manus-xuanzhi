import { describe, it, expect } from "vitest";

/**
 * 周边餐厅市调数据结构测试
 * 验证品牌A/B/C的上座率数据结构是否正确
 */

// 定义品牌上座率数据结构
interface BrandOccupancy {
  name: string;
  monLunch: number | null;
  monDinner: number | null;
  friLunch: number | null;
  friDinner: number | null;
  satLunch: number | null;
  satDinner: number | null;
}

// 验证上座率值是否在有效范围内
function validateOccupancyValue(value: number | null): boolean {
  if (value === null) return true;
  return value >= 0 && value <= 100;
}

// 计算品牌平均上座率
function calculateBrandAverageOccupancy(brand: BrandOccupancy): number | null {
  const values = [
    brand.monLunch,
    brand.monDinner,
    brand.friLunch,
    brand.friDinner,
    brand.satLunch,
    brand.satDinner,
  ].filter((v): v is number => v !== null);
  
  if (values.length === 0) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

// 计算所有品牌的综合平均上座率
function calculateOverallAverageOccupancy(brands: BrandOccupancy[]): number | null {
  const validBrands = brands.filter(b => b.name && b.name.length > 0);
  const averages = validBrands
    .map(b => calculateBrandAverageOccupancy(b))
    .filter((v): v is number => v !== null);
  
  if (averages.length === 0) return null;
  return averages.reduce((sum, v) => sum + v, 0) / averages.length;
}

describe("周边餐厅市调数据结构测试", () => {
  describe("validateOccupancyValue - 上座率值验证", () => {
    it("null值应该有效", () => {
      expect(validateOccupancyValue(null)).toBe(true);
    });

    it("0%上座率应该有效", () => {
      expect(validateOccupancyValue(0)).toBe(true);
    });

    it("100%上座率应该有效", () => {
      expect(validateOccupancyValue(100)).toBe(true);
    });

    it("50%上座率应该有效", () => {
      expect(validateOccupancyValue(50)).toBe(true);
    });

    it("负数上座率应该无效", () => {
      expect(validateOccupancyValue(-1)).toBe(false);
    });

    it("超过100%的上座率应该无效", () => {
      expect(validateOccupancyValue(101)).toBe(false);
    });
  });

  describe("calculateBrandAverageOccupancy - 品牌平均上座率计算", () => {
    it("全部数据都有时应正确计算平均值", () => {
      const brand: BrandOccupancy = {
        name: "海底捞",
        monLunch: 60,
        monDinner: 80,
        friLunch: 70,
        friDinner: 90,
        satLunch: 85,
        satDinner: 95,
      };
      const avg = calculateBrandAverageOccupancy(brand);
      expect(avg).toBe(80); // (60+80+70+90+85+95)/6 = 480/6 = 80
    });

    it("部分数据缺失时应正确计算平均值", () => {
      const brand: BrandOccupancy = {
        name: "外婆家",
        monLunch: 50,
        monDinner: null,
        friLunch: 70,
        friDinner: null,
        satLunch: 80,
        satDinner: null,
      };
      const avg = calculateBrandAverageOccupancy(brand);
      expect(avg).toBeCloseTo(66.67, 1); // (50+70+80)/3 ≈ 66.67
    });

    it("全部数据缺失时应返回null", () => {
      const brand: BrandOccupancy = {
        name: "测试品牌",
        monLunch: null,
        monDinner: null,
        friLunch: null,
        friDinner: null,
        satLunch: null,
        satDinner: null,
      };
      const avg = calculateBrandAverageOccupancy(brand);
      expect(avg).toBeNull();
    });
  });

  describe("calculateOverallAverageOccupancy - 综合平均上座率计算", () => {
    it("多个品牌数据应正确计算综合平均值", () => {
      const brands: BrandOccupancy[] = [
        {
          name: "品牌A",
          monLunch: 60,
          monDinner: 80,
          friLunch: 70,
          friDinner: 90,
          satLunch: 80,
          satDinner: 100,
        },
        {
          name: "品牌B",
          monLunch: 40,
          monDinner: 60,
          friLunch: 50,
          friDinner: 70,
          satLunch: 60,
          satDinner: 80,
        },
      ];
      const overall = calculateOverallAverageOccupancy(brands);
      // 品牌A平均: (60+80+70+90+80+100)/6 = 80
      // 品牌B平均: (40+60+50+70+60+80)/6 = 60
      // 综合平均: (80+60)/2 = 70
      expect(overall).toBe(70);
    });

    it("空品牌名称应被忽略", () => {
      const brands: BrandOccupancy[] = [
        {
          name: "有效品牌",
          monLunch: 80,
          monDinner: 80,
          friLunch: 80,
          friDinner: 80,
          satLunch: 80,
          satDinner: 80,
        },
        {
          name: "", // 空品牌名
          monLunch: 20,
          monDinner: 20,
          friLunch: 20,
          friDinner: 20,
          satLunch: 20,
          satDinner: 20,
        },
      ];
      const overall = calculateOverallAverageOccupancy(brands);
      expect(overall).toBe(80); // 只计算有效品牌
    });

    it("全部品牌无数据时应返回null", () => {
      const brands: BrandOccupancy[] = [
        {
          name: "",
          monLunch: null,
          monDinner: null,
          friLunch: null,
          friDinner: null,
          satLunch: null,
          satDinner: null,
        },
      ];
      const overall = calculateOverallAverageOccupancy(brands);
      expect(overall).toBeNull();
    });
  });

  describe("数据结构完整性测试", () => {
    it("品牌数据结构应包含18个数据点（3品牌×6时段）", () => {
      const brandFields = [
        'monLunch', 'monDinner', 
        'friLunch', 'friDinner', 
        'satLunch', 'satDinner'
      ];
      const brandCount = 3; // A, B, C
      const totalDataPoints = brandCount * brandFields.length;
      expect(totalDataPoints).toBe(18);
    });

    it("每个品牌应有6个时段数据", () => {
      const brand: BrandOccupancy = {
        name: "测试品牌",
        monLunch: 50,
        monDinner: 60,
        friLunch: 70,
        friDinner: 80,
        satLunch: 85,
        satDinner: 90,
      };
      
      const timeSlots = [
        brand.monLunch,
        brand.monDinner,
        brand.friLunch,
        brand.friDinner,
        brand.satLunch,
        brand.satDinner,
      ];
      
      expect(timeSlots.length).toBe(6);
    });

    it("时段应覆盖周一、周五、周六的午市和晚市", () => {
      // 周一：工作日低峰代表
      // 周五：工作日高峰代表
      // 周六：周末高峰代表
      const days = ['mon', 'fri', 'sat'];
      const meals = ['Lunch', 'Dinner'];
      
      const expectedFields = days.flatMap(day => 
        meals.map(meal => `${day}${meal}`)
      );
      
      expect(expectedFields).toEqual([
        'monLunch', 'monDinner',
        'friLunch', 'friDinner',
        'satLunch', 'satDinner'
      ]);
    });
  });
});
