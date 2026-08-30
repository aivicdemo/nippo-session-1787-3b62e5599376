import { identifyProductivityAnomalies } from '../../src/logic/productivity-metrics-calculation';
import type { ProductivityAnomalyDetectionInput, ProductivityMetric } from '../../src/logic/productivity-metrics-calculation';

describe('朝会報告管理システム - 生産性異常値検出', () => {
  // SCEN-108
  test('分析対象期間内の有効なメトリクスデータが最小サンプル数に満たない場合、異常値検出エラーを発生させる', () => {
    const metricsDataset: ProductivityMetric[] = [
      {
        metricId: 'metric-001',
        metricType: 'issueResolutionSpeed',
        value: 5.5,
        teamId: 'team-001',
        measurementDate: new Date('2024-01-01T09:00:00Z'),
      },
      {
        metricId: 'metric-002',
        metricType: 'issueResolutionSpeed',
        value: 6.2,
        teamId: 'team-001',
        measurementDate: new Date('2024-01-08T09:00:00Z'),
      },
    ];

    const input: ProductivityAnomalyDetectionInput = {
      metricsDataset: metricsDataset,
      aggregationPeriod: 'monthly',
      anomalyThresholdConfig: {
        standardDeviationMultiplier: 2.0,
        percentileThreshold: 50,
      },
      requestingUserId: 'user-001',
    };

    expect(() => identifyProductivityAnomalies(input)).toThrow(
      /異常値検出に必要な最小データ量が不足しています/
    );
  });
});