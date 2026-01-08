import { describe, it, expect } from 'vitest';
import { getCompetitionLevel } from './dataCenter';

describe('数据中心服务', () => {
  describe('getCompetitionLevel - 竞争饱和度等级计算', () => {
    it('应该返回蓝海等级当同品类数量<=2', () => {
      const result = getCompetitionLevel(0);
      expect(result.level).toBe('low');
      expect(result.label).toBe('蓝海');
      
      const result2 = getCompetitionLevel(2);
      expect(result2.level).toBe('low');
    });

    it('应该返回正常等级当同品类数量3-5', () => {
      const result = getCompetitionLevel(3);
      expect(result.level).toBe('medium');
      expect(result.label).toBe('正常');
      
      const result2 = getCompetitionLevel(5);
      expect(result2.level).toBe('medium');
    });

    it('应该返回红海等级当同品类数量6-10', () => {
      const result = getCompetitionLevel(6);
      expect(result.level).toBe('high');
      expect(result.label).toBe('红海');
      
      const result2 = getCompetitionLevel(10);
      expect(result2.level).toBe('high');
    });

    it('应该返回过饱和等级当同品类数量>10', () => {
      const result = getCompetitionLevel(11);
      expect(result.level).toBe('saturated');
      expect(result.label).toBe('过饱和');
      
      const result2 = getCompetitionLevel(20);
      expect(result2.level).toBe('saturated');
    });
  });
});
