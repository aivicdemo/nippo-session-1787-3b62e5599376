import { calculateProductivityMetrics } from '../../src/logic/productivity-metrics-calculation';

describe('朝会報告管理システム', () => {
  test('SCEN-103: 指定期間内の日報データが5件未満、または提出率が50%未満の場合、分析に必要な最小限のデータが不足しているエラーをスローする', () => {
    const aggregationStartDate = new Date('2025-01-01T00:00:00Z');
    const aggregationEndDate = new Date('2025-01-31T23:59:59Z');
    const targetTeamIds = ['team-001'];
    const excludeOutliers = false;

    const input = {
      aggregationStartDate,
      aggregationEndDate,
      targetTeamIds,
      excludeOutliers,
    };

    expect(() => calculateProductivityMetrics(input)).toThrow(/分析に必要な最小限のデータが不足しています/);
  });
});