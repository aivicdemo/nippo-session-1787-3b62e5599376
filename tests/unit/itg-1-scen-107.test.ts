import { identifyProductivityAnomalies } from '../../src/logic/productivity-metrics-calculation';
import type { ProductivityMetric, AnomalyThresholdConfiguration, ProductivityAnomalyDetectionResult } from '../../src/logic/productivity-metrics-calculation';

describe('朝会報告管理システム - 生産性指標異常値検出', () => {
  // SCEN-107: [normal] 生産性指標の異常値を検出し、正常範囲の傾向を保持しつつ異常値の原因を分類する。
  test('identifyProductivityAnomaliesが代表的な正常入力を設計どおり処理する', () => {
    const metricsDataset: ProductivityMetric[] = [
      {
        metricId: 'metric-001',
        metricType: 'issueResolutionSpeed',
        value: 5,
        teamId: 'team-001',
        measurementDate: new Date('2024-01-01'),
      },
      {
        metricId: 'metric-002',
        metricType: 'reportSubmissionRate',
        value: 95,
        teamId: 'team-001',
        measurementDate: new Date('2024-01-01'),
      },
      {
        metricId: 'metric-003',
        metricType: 'issueRecurrenceRate',
        value: 2,
        teamId: 'team-001',
        measurementDate: new Date('2024-01-01'),
      },
      {
        metricId: 'metric-004',
        metricType: 'teamProductivityScore',
        value: 88,
        teamId: 'team-001',
        measurementDate: new Date('2024-01-01'),
      },
    ];

    const anomalyThresholdConfig: AnomalyThresholdConfiguration = {
      standardDeviationMultiplier: 2.0,
      percentileThreshold: 95,
    };

    const requestingUserId = 'user-001';

    const result: ProductivityAnomalyDetectionResult = identifyProductivityAnomalies(
      metricsDataset,
      'monthly',
      anomalyThresholdConfig,
      requestingUserId
    );

    expect(result).toBeDefined();
    expect(result.detectedAnomalies).toBeDefined();
    expect(Array.isArray(result.detectedAnomalies)).toBe(true);
    expect(result.detectedAnomalies.length).toBe(0);

    expect(result.normalRangeStatistics).toBeDefined();
    expect(typeof result.normalRangeStatistics.mean).toBe('number');
    expect(typeof result.normalRangeStatistics.standardDeviation).toBe('number');
    expect(typeof result.normalRangeStatistics.percentile95).toBe('number');

    expect(result.anomalyClassifications).toBeDefined();
    expect(Array.isArray(result.anomalyClassifications)).toBe(true);
    expect(result.anomalyClassifications.length).toBe(0);
  });
});