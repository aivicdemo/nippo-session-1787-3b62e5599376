import { calculateProductivityMetrics } from '../../src/logic/productivity-metrics-calculation';

describe('朝会報告管理システム - 生産性指標計算', () => {
  // SCEN-538
  test('チームメンバー数が0のときエラーをスロー', () => {
    const input = {
      aggregationStartDate: new Date('2024-01-01'),
      aggregationEndDate: new Date('2024-01-31'),
      targetTeamIds: ['team-001'],
      excludeOutliers: false,
      teamMemberCount: 0,
    };

    expect(() => calculateProductivityMetrics(input)).toThrow(/チームメンバー数が正しく設定されていません/);
  });
});