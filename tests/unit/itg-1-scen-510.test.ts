import { analyzeProductivityTrends } from '../../src/logic/productivity-metrics-calculation';
import { type ProductivityTrendsAnalysisInput, type ProductivityMetricsDataPoint, type SuccessCriteria } from '../../src/logic/productivity-metrics-calculation';

describe('朝会報告管理システム - 生産性指標傾向分析', () => {
  // SCEN-510
  test('ベースライン課題発生頻度が0以下の場合、設計済みエラーを発生させる', () => {
    const aggregationPeriodStart = new Date('2024-01-01');
    const aggregationPeriodEnd = new Date('2024-03-31');

    const dataPoint1: ProductivityMetricsDataPoint = {
      periodDate: new Date('2024-01-31'),
      issueResolutionSpeed: 5.2,
      reportSubmissionRate: 85.0,
      issueRecurrenceRate: 12.5,
      teamProductivityScore: 78.0
    };

    const dataPoint2: ProductivityMetricsDataPoint = {
      periodDate: new Date('2024-02-29'),
      issueResolutionSpeed: 4.8,
      reportSubmissionRate: 88.0,
      issueRecurrenceRate: 10.0,
      teamProductivityScore: 82.0
    };

    const dataPoint3: ProductivityMetricsDataPoint = {
      periodDate: new Date('2024-03-31'),
      issueResolutionSpeed: 4.5,
      reportSubmissionRate: 90.0,
      issueRecurrenceRate: 8.5,
      teamProductivityScore: 85.0
    };

    const successCriteria: SuccessCriteria = {
      productivityImprovementRateTarget: 15.0,
      issueRecurrenceRateReductionTarget: 30.0,
      deadlineComplianceRateTarget: 90.0
    };

    const input: ProductivityTrendsAnalysisInput = {
      aggregationPeriodStart: aggregationPeriodStart,
      aggregationPeriodEnd: aggregationPeriodEnd,
      productivityMetricsDataPoints: [dataPoint1, dataPoint2, dataPoint3],
      successCriteria: successCriteria,
      teamId: 'team-001',
      analysisContext: '対策実行計画ID: plan-123'
    };

    // baselineIssueFrequency が 0 の場合、エラーが発生することを検証
    expect(() => analyzeProductivityTrends(input)).toThrow(/対策前の課題発生頻度/);
  });
});