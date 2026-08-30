import { calculateProductivityMetrics } from '../../src/logic/productivity-metrics-calculation';

describe('朝会報告管理システム', () => {
  // SCEN-537
  test('集約期間内に提出された日報が1件も存在しないときはInsufficientDataErrorエラーを発生させる', () => {
    const aggregationStartDate = new Date('2024-01-01T00:00:00Z');
    const aggregationEndDate = new Date('2024-01-31T23:59:59Z');
    const targetTeamIds = ['team-001'];
    const excludeOutliers = false;

    const input = {
      aggregationStartDate,
      aggregationEndDate,
      targetTeamIds,
      excludeOutliers,
    };

    expect(() => calculateProductivityMetrics(input)).toThrow(/日報データ/);
  });
});