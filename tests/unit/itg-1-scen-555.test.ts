import { calculateProductivityMetrics } from '../../src/logic/productivity-metrics-calculation';
import { type ProductivityMetricsInput, type ProductivityMetricsOutput } from '../../src/logic/productivity-metrics-calculation';

describe('朝会報告管理システム - 生産性指標計算', () => {
  // SCEN-555
  test('改善施策の必要リソースが利用可能リソースを超える場合、警告フラグが返却される', () => {
    const analysisStartDate = new Date('2024-01-01T00:00:00Z');
    const analysisEndDate = new Date('2024-01-31T23:59:59Z');
    
    const improvementMeasures = [
      {
        measureId: 'measure_001',
        description: '課題追跡ツール導入',
        estimatedImplementationDays: 20,
        realizabilityScore: 85
      },
      {
        measureId: 'measure_002',
        description: 'チーム研修実施',
        estimatedImplementationDays: 10,
        realizabilityScore: 60
      }
    ];

    const issueFrequencyDistribution = {
      'バグ対応': 15,
      'パフォーマンス改善': 12,
      '仕様確認': 10,
      'インテグレーション': 8
    };

    const input: ProductivityMetricsInput = {
      aggregationStartDate: analysisStartDate,
      aggregationEndDate: analysisEndDate,
      targetTeamIds: ['team_001'],
      excludeOutliers: false
    };

    const result: ProductivityMetricsOutput = calculateProductivityMetrics(input);

    expect(result).toBeDefined();
    expect(result.detectedAnomalies).toBeDefined();
    
    const hasResourceWarning = result.detectedAnomalies?.some(
      (anomaly) => anomaly.rootCauseClassification && anomaly.rootCauseClassification.includes('リソース')
    ) || false;

    expect(hasResourceWarning).toBe(true);
  });
});