import { analyzeProductivityTrends, type ProductivityTrendsAnalysisInput } from '../../src/logic/productivity-metrics-calculation';

describe('analyzeProductivityTrends - Issue Recurrence Rate Boundary Validation', () => {
  // SCEN-515
  test('should throw AnalysisDataQualityValidationFailedError when issue recurrence rate is negative', () => {
    const negativeRecurrenceInput: ProductivityTrendsAnalysisInput = {
      aggregationPeriodStart: new Date('2024-01-01'),
      aggregationPeriodEnd: new Date('2024-03-31'),
      productivityMetricsDataPoints: [
        {
          periodDate: new Date('2024-01-31'),
          issueResolutionSpeed: 5.5,
          reportSubmissionRate: 85,
          issueRecurrenceRate: -5,
          teamProductivityScore: 75
        },
        {
          periodDate: new Date('2024-02-29'),
          issueResolutionSpeed: 5.8,
          reportSubmissionRate: 87,
          issueRecurrenceRate: 8,
          teamProductivityScore: 76
        },
        {
          periodDate: new Date('2024-03-31'),
          issueResolutionSpeed: 5.2,
          reportSubmissionRate: 89,
          issueRecurrenceRate: 6,
          teamProductivityScore: 78
        }
      ],
      successCriteria: {
        productivityImprovementRateTarget: 15,
        issueRecurrenceRateReductionTarget: 30,
        deadlineComplianceRateTarget: 90
      },
      teamId: 'team-001',
      analysisContext: 'Q1 performance analysis for improvement measures'
    };

    expect(() => analyzeProductivityTrends(negativeRecurrenceInput)).toThrow(/分析対象データの品質検証に失敗しました/);
  });

  test('should throw AnalysisDataQualityValidationFailedError when issue recurrence rate exceeds 100', () => {
    const exceedingRecurrenceInput: ProductivityTrendsAnalysisInput = {
      aggregationPeriodStart: new Date('2024-01-01'),
      aggregationPeriodEnd: new Date('2024-03-31'),
      productivityMetricsDataPoints: [
        {
          periodDate: new Date('2024-01-31'),
          issueResolutionSpeed: 5.5,
          reportSubmissionRate: 85,
          issueRecurrenceRate: 12,
          teamProductivityScore: 75
        },
        {
          periodDate: new Date('2024-02-29'),
          issueResolutionSpeed: 5.8,
          reportSubmissionRate: 87,
          issueRecurrenceRate: 9,
          teamProductivityScore: 76
        },
        {
          periodDate: new Date('2024-03-31'),
          issueResolutionSpeed: 5.2,
          reportSubmissionRate: 89,
          issueRecurrenceRate: 105,
          teamProductivityScore: 78
        }
      ],
      successCriteria: {
        productivityImprovementRateTarget: 15,
        issueRecurrenceRateReductionTarget: 30,
        deadlineComplianceRateTarget: 90
      },
      teamId: 'team-001',
      analysisContext: 'Q1 performance analysis for improvement measures'
    };

    expect(() => analyzeProductivityTrends(exceedingRecurrenceInput)).toThrow(/分析対象データの品質検証に失敗しました/);
  });
});