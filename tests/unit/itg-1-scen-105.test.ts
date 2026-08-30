import { analyzeProductivityTrends, type ProductivityTrendsAnalysisInput, type ProductivityMetricsDataPoint, type SuccessCriteria } from '../../src/logic/productivity-metrics-calculation';

describe('朝会報告管理システム', () => {
  test('SCEN-105: 生産性指標データが3データポイント未満の場合、傾向分析に必要な最小データ量エラーをスロー', () => {
    const dataPoint1: ProductivityMetricsDataPoint = {
      periodDate: new Date('2024-01-05T00:00:00Z'),
      issueResolutionSpeed: 5.2,
      reportSubmissionRate: 95.0,
      issueRecurrenceRate: 8.5,
      teamProductivityScore: 78
    };

    const dataPoint2: ProductivityMetricsDataPoint = {
      periodDate: new Date('2024-01-12T00:00:00Z'),
      issueResolutionSpeed: 5.5,
      reportSubmissionRate: 93.0,
      issueRecurrenceRate: 9.2,
      teamProductivityScore: 76
    };

    const successCriteria: SuccessCriteria = {
      productivityImprovementRateTarget: 15,
      issueRecurrenceRateReductionTarget: 30,
      deadlineComplianceRateTarget: 90
    };

    const input: ProductivityTrendsAnalysisInput = {
      aggregationPeriodStart: new Date('2024-01-01T00:00:00Z'),
      aggregationPeriodEnd: new Date('2024-01-31T23:59:59Z'),
      productivityMetricsDataPoints: [dataPoint1, dataPoint2],
      successCriteria: successCriteria,
      teamId: 'team-001',
      analysisContext: undefined
    };

    expect(() => analyzeProductivityTrends(input)).toThrow(/最小データ量/);
  });
});