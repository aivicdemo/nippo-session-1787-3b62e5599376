import { describe, test, expect } from '@jest/globals';
import { analyzeProductivityTrends } from '../../src/logic/productivity-metrics-calculation';
import type {
  ProductivityTrendsAnalysisInput,
  ProductivityMetricsDataPoint,
  SuccessCriteria,
} from '../../src/logic/productivity-metrics-calculation';

describe('productivity-metrics-calculation', () => {
  // SCEN-507
  test('should throw error when countermeasure plan ID is empty string', () => {
    const successCriteriaValue: SuccessCriteria = {
      productivityImprovementRateTarget: 15,
      issueRecurrenceRateReductionTarget: 30,
      deadlineComplianceRateTarget: 90,
    };

    const dataPointsValue: ProductivityMetricsDataPoint[] = [
      {
        periodDate: new Date('2024-01-01'),
        issueResolutionSpeed: 5.2,
        reportSubmissionRate: 85,
        issueRecurrenceRate: 12,
        teamProductivityScore: 72,
      },
      {
        periodDate: new Date('2024-02-01'),
        issueResolutionSpeed: 4.8,
        reportSubmissionRate: 88,
        issueRecurrenceRate: 10,
        teamProductivityScore: 75,
      },
      {
        periodDate: new Date('2024-03-01'),
        issueResolutionSpeed: 4.5,
        reportSubmissionRate: 92,
        issueRecurrenceRate: 8,
        teamProductivityScore: 78,
      },
    ];

    const inputValue: ProductivityTrendsAnalysisInput = {
      aggregationPeriodStart: new Date('2024-01-01'),
      aggregationPeriodEnd: new Date('2024-03-31'),
      productivityMetricsDataPoints: dataPointsValue,
      successCriteria: successCriteriaValue,
      teamId: 'team-001',
      analysisContext: '',
    };

    expect(() => analyzeProductivityTrends(inputValue)).toThrow(/対策計画/);
  });
});