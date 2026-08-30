import { describe, test, expect } from '@jest/globals';
import { analyzeProductivityTrends, type ProductivityTrendsAnalysisInput } from '../../src/logic/productivity-metrics-calculation';

describe('productivity-metrics-calculation', () => {
  test('SCEN-509: analyzeProductivityTrends throws InsufficientDataForTrendAnalysisError when no data points exist within aggregation period', () => {
    const input: ProductivityTrendsAnalysisInput = {
      aggregationPeriodStart: new Date('2024-01-01T00:00:00Z'),
      aggregationPeriodEnd: new Date('2024-03-31T23:59:59Z'),
      productivityMetricsDataPoints: [],
      successCriteria: {
        productivityImprovementRateTarget: 30,
        issueRecurrenceRateReductionTarget: 25,
        deadlineComplianceRateTarget: 90,
      },
      teamId: 'team-001',
      analysisContext: '対策実行計画の効果測定期間',
    };

    expect(() => analyzeProductivityTrends(input)).toThrow(/データが蓄積/);
  });
});