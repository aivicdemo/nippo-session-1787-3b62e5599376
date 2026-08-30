import { analyzeProductivityTrends } from '../../src/logic/productivity-metrics-calculation';
import { type ProductivityTrendsAnalysisInput } from '../../src/logic/productivity-metrics-calculation';

describe('朝会報告管理システム', () => {
  // SCEN-516
  test('成功判定基準が設定されていないときは SuccessCriteriaComparisonFailedError を発生させる', () => {
    const input: ProductivityTrendsAnalysisInput = {
      aggregationPeriodStart: new Date('2024-01-01'),
      aggregationPeriodEnd: new Date('2024-03-31'),
      productivityMetricsDataPoints: [
        {
          periodDate: new Date('2024-01-31'),
          issueResolutionSpeed: 5.0,
          reportSubmissionRate: 95,
          issueRecurrenceRate: 8,
          teamProductivityScore: 78,
        },
        {
          periodDate: new Date('2024-02-29'),
          issueResolutionSpeed: 4.5,
          reportSubmissionRate: 97,
          issueRecurrenceRate: 6,
          teamProductivityScore: 82,
        },
        {
          periodDate: new Date('2024-03-31'),
          issueResolutionSpeed: 4.0,
          reportSubmissionRate: 98,
          issueRecurrenceRate: 5,
          teamProductivityScore: 85,
        },
      ],
      successCriteria: null,
      teamId: 'team-001',
      analysisContext: '対策実行計画の評価',
    };

    expect(() => analyzeProductivityTrends(input)).toThrow(/成功判定基準/);
  });
});