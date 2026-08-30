import { analyzeProductivityTrends } from '../../src/logic/productivity-metrics-calculation';
import type {
  ProductivityTrendsAnalysisInput,
  ProductivityMetricsDataPoint,
  SuccessCriteria,
  ProductivityTrendsAnalysisResult,
} from '../../src/logic/productivity-metrics-calculation';

describe('朝会報告管理システム - 生産性傾向分析', () => {
  // SCEN-106: 分析対象データの品質検証失敗時にエラーを発生させる
  test('should throw AnalysisDataQualityValidationFailedError when data quality validation fails', async () => {
    const metricsDataPoint1: ProductivityMetricsDataPoint = {
      periodDate: new Date('2024-01-15'),
      issueResolutionSpeed: 5.2,
      reportSubmissionRate: 92.5,
      issueRecurrenceRate: 8.3,
      teamProductivityScore: 78,
    };

    const metricsDataPoint2: ProductivityMetricsDataPoint = {
      periodDate: new Date('2024-02-15'),
      issueResolutionSpeed: 4.8,
      reportSubmissionRate: 95.0,
      issueRecurrenceRate: 7.1,
      teamProductivityScore: 82,
    };

    const metricsDataPoint3: ProductivityMetricsDataPoint = {
      periodDate: new Date('2024-03-15'),
      issueResolutionSpeed: 5.5,
      reportSubmissionRate: 88.0,
      issueRecurrenceRate: 9.2,
      teamProductivityScore: 75,
    };

    const successCriteria: SuccessCriteria = {
      productivityImprovementRateTarget: 15,
      issueRecurrenceRateReductionTarget: 30,
      deadlineComplianceRateTarget: 85,
    };

    const input: ProductivityTrendsAnalysisInput = {
      aggregationPeriodStart: new Date('2024-01-01'),
      aggregationPeriodEnd: new Date('2024-03-31'),
      productivityMetricsDataPoints: [metricsDataPoint1, metricsDataPoint2, metricsDataPoint3],
      successCriteria: successCriteria,
      teamId: 'team-001',
    };

    await expect(analyzeProductivityTrends(input)).rejects.toThrow(/データ品質検証/);
  });
});