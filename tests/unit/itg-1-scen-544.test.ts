import { calculateProductivityMetrics, type ProductivityMetricsInput } from '../../src/logic/productivity-metrics-calculation';

describe('朝会報告管理システム - 生産性指標計算ロジック', () => {
  // SCEN-544: 課題の報告日が解決日より後になっている場合、データ矛盾エラーを発生させる
  test('should throw error when reported date is after resolved date', () => {
    const input: ProductivityMetricsInput = {
      aggregationStartDate: new Date('2024-01-01'),
      aggregationEndDate: new Date('2024-01-31'),
      targetTeamIds: ['team-A'],
      excludeOutliers: false,
      issueResolutionLog: [
        {
          issueId: 'issue-001',
          reportedDate: new Date('2024-01-15'),
          resolvedDate: new Date('2024-01-10'),
          status: 'resolved',
        },
      ],
      reportSubmissionLog: [],
      issueRecurrenceLog: [],
      teamSize: 5,
    };

    expect(() => calculateProductivityMetrics(input)).toThrow(/報告日/);
  });
});