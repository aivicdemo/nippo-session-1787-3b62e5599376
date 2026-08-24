import { describe, test, expect } from '@jest/globals';
import { calculateTeamPerformanceMetrics } from '../../src/logic/monthly-performance-analysis';
import { type TeamPerformanceMetricsInput } from '../../src/logic/monthly-performance-analysis';

describe('生産性指標計算機能 - 集約期間内の日報データが空のとき', () => {
  // SCEN-2286
  test('集約期間内に計算対象の日報データが存在しない場合、エラーが発生する', () => {
    const aggregationStartDate = new Date('2026-01-01T00:00:00Z');
    const aggregationEndDate = new Date('2026-01-31T23:59:59Z');
    const teamId = 'team-001';
    const emptyReportRecords: any[] = [];

    const input: TeamPerformanceMetricsInput = {
      aggregationStartDate,
      aggregationEndDate,
      teamId,
      reportRecords: emptyReportRecords,
    };

    expect(() => {
      calculateTeamPerformanceMetrics(input);
    }).toThrow(/指定期間内に計算対象の日報データが存在しません/);
  });
});