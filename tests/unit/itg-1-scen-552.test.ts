import { calculateProductivityMetrics } from '../../src/logic/productivity-metrics-calculation';

describe('朝会報告管理システム - 生産性指標計算', () => {
  // SCEN-552
  test('期待日報件数がゼロのとき、チーム人数または営業日数の設定が不正というエラーを throw する', () => {
    const analysisStartDate = new Date('2024-01-01');
    const analysisEndDate = new Date('2024-01-31');
    const totalReportCount = 5;
    const extractedIssueCount = 3;
    const issueFrequencyDistribution: Record<string, number> = {
      'ログイン遅延': 2,
      'ビルド失敗': 1,
    };
    const improvementMeasures = [
      {
        title: '認証システム改善',
        estimatedImpact: 75,
        resourceRequired: 40,
      },
    ];
    const managerReviewThreshold = 70;
    const expectedReportCount = 0;

    const input = {
      aggregationPeriodStartDate: analysisStartDate,
      aggregationPeriodEndDate: analysisEndDate,
      reportDataset: {
        issueResolutionSpeed: 5.2,
        reportSubmissionRate: 83.3,
        issueRecurrenceRate: 22.5,
        teamProductivityScore: 72,
      },
      analysisLogicVersion: '1.0.0',
      proposedImprovementMeasures: improvementMeasures,
      dataCompletenessThresholdPercent: 80,
    };

    expect(() => calculateProductivityMetrics(input)).toThrow(
      /チーム人数または営業日数/
    );
  });
});