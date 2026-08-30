import { calculateProductivityMetrics, type ProductivityMetricsInput, type ProductivityMetricsOutput } from '../../src/logic/productivity-metrics-calculation';

describe('朝会報告管理システム - 生産性指標計算', () => {
  // SCEN-541
  test('指定された集約期間内の日報データから生産性指標を計算し、チーム生産性スコアが0～100の範囲内に正規化される', () => {
    // Arrange
    const aggregationStartDate = new Date('2024-01-01T00:00:00Z');
    const aggregationEndDate = new Date('2024-01-31T23:59:59Z');
    const targetTeamIds = ['team-001'];

    const input: ProductivityMetricsInput = {
      aggregationStartDate,
      aggregationEndDate,
      targetTeamIds,
      excludeOutliers: false,
    };

    // メンバー別スコアの期待値: 60, 80, 40 → 平均60.0
    const expectedTeamProductivityScore = 60.0;

    // Act
    const result: ProductivityMetricsOutput = calculateProductivityMetrics(input);

    // Assert
    // teamProductivityScoreが0～100の範囲内であることを確認
    expect(result.teamProductivityScore).toBeGreaterThanOrEqual(0);
    expect(result.teamProductivityScore).toBeLessThanOrEqual(100);

    // 具体値で検証: メンバー別スコア（60, 80, 40）の平均が60.0
    expect(result.teamProductivityScore).toBe(expectedTeamProductivityScore);

    // 出力型の全フィールドが適切に構成されていることを確認
    expect(typeof result.issueResolutionSpeed).toBe('number');
    expect(typeof result.reportSubmissionRate).toBe('number');
    expect(typeof result.issueRecurrenceRate).toBe('number');
    expect(typeof result.teamProductivityScore).toBe('number');
    expect(Array.isArray(result.detectedAnomalies) || result.detectedAnomalies === undefined).toBe(true);
    expect(result.dataQualityAssessment).toBeDefined();
    expect(typeof result.dataQualityAssessment.completenessPercentage).toBe('number');
    expect(typeof result.dataQualityAssessment.extractionAccuracy).toBe('number');
    expect(typeof result.dataQualityAssessment.isReportable).toBe('boolean');

    // 他の指標が期待値と一致することを確認
    expect(result.issueResolutionSpeed).toBe(5.5);
    expect(result.reportSubmissionRate).toBe(73.33);
    expect(result.issueRecurrenceRate).toBe(15.5);
    expect(result.detectedAnomalies).toEqual([]);
    expect(result.dataQualityAssessment.completenessPercentage).toBe(85);
    expect(result.dataQualityAssessment.extractionAccuracy).toBe(92);
  });
});