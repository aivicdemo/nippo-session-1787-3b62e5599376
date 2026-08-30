import { analyzeProductivityTrends } from '../../src/logic/productivity-metrics-calculation';
import type {
  ProductivityTrendsAnalysisInput,
  ProductivityMetricsDataPoint,
  SuccessCriteria,
} from '../../src/logic/productivity-metrics-calculation';

describe('朝会報告管理システム - 生産性傾向分析', () => {
  // SCEN-508
  test('計画開始日が計画完了予定日より後の場合、エラーを発生させる', () => {
    const metricsDataPoint1: ProductivityMetricsDataPoint = {
      periodDate: new Date('2024-01-11'),
      issueResolutionSpeed: 5.2,
      reportSubmissionRate: 95,
      issueRecurrenceRate: 12,
      teamProductivityScore: 78,
    };

    const metricsDataPoint2: ProductivityMetricsDataPoint = {
      periodDate: new Date('2024-01-12'),
      issueResolutionSpeed: 4.8,
      reportSubmissionRate: 98,
      issueRecurrenceRate: 10,
      teamProductivityScore: 82,
    };

    const metricsDataPoint3: ProductivityMetricsDataPoint = {
      periodDate: new Date('2024-01-13'),
      issueResolutionSpeed: 5.5,
      reportSubmissionRate: 92,
      issueRecurrenceRate: 14,
      teamProductivityScore: 76,
    };

    const successCriteria: SuccessCriteria = {
      productivityImprovementRateTarget: 15,
      issueRecurrenceRateReductionTarget: 30,
      deadlineComplianceRateTarget: 90,
    };

    const input: ProductivityTrendsAnalysisInput = {
      aggregationPeriodStart: new Date('2024-01-15'),
      aggregationPeriodEnd: new Date('2024-01-10'),
      productivityMetricsDataPoints: [
        metricsDataPoint1,
        metricsDataPoint2,
        metricsDataPoint3,
      ],
      successCriteria,
      teamId: 'team-001',
      analysisContext: '分析背景',
    };

    expect(() => analyzeProductivityTrends(input)).toThrow(
      /計画期間の設定が不正です/
    );
  });
});