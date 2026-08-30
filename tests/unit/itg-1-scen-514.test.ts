import { analyzeProductivityTrends } from '../../src/logic/productivity-metrics-calculation';
import { type ProductivityTrendsAnalysisInput, type SuccessCriteria } from '../../src/logic/productivity-metrics-calculation';

describe('朝会報告管理システム - 生産性指標傾向分析', () => {
  // SCEN-514
  test('生産性指標のデータが欠落しているときはAnalysisDataQualityValidationFailedErrorを発生させる', () => {
    const aggregationPeriodStart = new Date('2024-01-01');
    const aggregationPeriodEnd = new Date('2024-03-31');

    const productivityMetricsDataPoints = [
      {
        periodDate: new Date('2024-01-31'),
        issueResolutionSpeed: 5.2,
        reportSubmissionRate: 92.5,
        issueRecurrenceRate: 8.3,
        teamProductivityScore: 78.5,
        completedTaskCount: null,
        deadlineComplianceRate: 88.0,
      },
      {
        periodDate: new Date('2024-02-29'),
        issueResolutionSpeed: 4.8,
        reportSubmissionRate: 95.0,
        issueRecurrenceRate: 7.5,
        teamProductivityScore: 82.0,
        completedTaskCount: 145,
        deadlineComplianceRate: null,
      },
      {
        periodDate: new Date('2024-03-31'),
        issueResolutionSpeed: null,
        reportSubmissionRate: null,
        issueRecurrenceRate: null,
        teamProductivityScore: null,
        completedTaskCount: null,
        deadlineComplianceRate: null,
      },
    ];

    const successCriteria: SuccessCriteria = {
      productivityImprovementRateTarget: 15.0,
      issueRecurrenceRateReductionTarget: 20.0,
      deadlineComplianceRateTarget: 90.0,
    };

    const input: ProductivityTrendsAnalysisInput = {
      aggregationPeriodStart,
      aggregationPeriodEnd,
      productivityMetricsDataPoints,
      successCriteria,
      teamId: 'team-001',
      analysisContext: '対策実行計画の成功判定',
    };

    expect(() => analyzeProductivityTrends(input)).toThrow(
      /生産性指標データが不完全です/
    );
  });
});