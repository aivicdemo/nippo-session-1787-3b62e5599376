import { describe, test, expect } from '@jest/globals';
import { calculateTeamPerformanceMetrics } from '../../src/logic/monthly-performance-analysis';
import { type TeamPerformanceMetricsInput } from '../../src/logic/monthly-performance-analysis';

describe('朝会報告管理システム - 生産性指標計算機能', () => {
  // SCEN-2284
  test('集約期間開始日が指定されていないとき、ValidationErrorが発生する', () => {
    const invalidInputs: Array<{
      aggregationStartDate: any;
      aggregationEndDate: string;
      teamIds: string[];
      reportDataset: any[];
    }> = [
      {
        aggregationStartDate: null,
        aggregationEndDate: '2024-01-31T23:59:59Z',
        teamIds: ['team-001'],
        reportDataset: [],
      },
      {
        aggregationStartDate: undefined,
        aggregationEndDate: '2024-01-31T23:59:59Z',
        teamIds: ['team-001'],
        reportDataset: [],
      },
      {
        aggregationStartDate: '',
        aggregationEndDate: '2024-01-31T23:59:59Z',
        teamIds: ['team-001'],
        reportDataset: [],
      },
    ];

    invalidInputs.forEach((invalidInput) => {
      expect(() => {
        calculateTeamPerformanceMetrics(invalidInput as TeamPerformanceMetricsInput);
      }).toThrow(/集約期間開始日/);

      try {
        calculateTeamPerformanceMetrics(invalidInput as TeamPerformanceMetricsInput);
      } catch (error) {
        expect(error).toHaveProperty('name', 'ValidationError');
        expect((error as Error).message).toContain('集約期間開始日は必須です');
        expect((error as Error).stack).toBeDefined();
        expect((error as Error).stack).toMatch(/\d+/);
      }
    });
  });
});