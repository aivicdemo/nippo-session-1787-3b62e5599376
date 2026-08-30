import { calculateProductivityMetrics, type ProductivityMetricsInput, type ProductivityMetricsOutput } from '../../src/logic/productivity-metrics-calculation';

describe('朝会報告管理システム - 生産性指標計算', () => {
  // SCEN-558: 比較対象期間が現在の期間と同じときの警告メッセージ発動確認
  test('should emit warning when comparison period matches current period (same month)', async () => {
    const aggregationStartDate = new Date('2024-11-01T00:00:00Z');
    const aggregationEndDate = new Date('2024-11-30T23:59:59Z');
    const targetTeamIds = ['team-001', 'team-002'];

    const input: ProductivityMetricsInput = {
      aggregationStartDate: aggregationStartDate,
      aggregationEndDate: aggregationEndDate,
      targetTeamIds: targetTeamIds,
      excludeOutliers: false
    };

    // Mock console.warn to capture warning messages
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    try {
      const result: ProductivityMetricsOutput = await calculateProductivityMetrics(input);

      // Verify that all required fields in ProductivityMetricsOutput are set
      expect(result).toBeDefined();
      expect(typeof result.issueResolutionSpeed).toBe('number');
      expect(typeof result.reportSubmissionRate).toBe('number');
      expect(typeof result.issueRecurrenceRate).toBe('number');
      expect(typeof result.teamProductivityScore).toBe('number');
      expect(result.dataQualityAssessment).toBeDefined();
      expect(typeof result.dataQualityAssessment.completenessPercentage).toBe('number');
      expect(typeof result.dataQualityAssessment.extractionAccuracy).toBe('number');
      expect(typeof result.dataQualityAssessment.isReportable).toBe('boolean');

      // Verify metric value ranges
      expect(result.issueResolutionSpeed).toBeGreaterThanOrEqual(0);
      expect(result.reportSubmissionRate).toBeGreaterThanOrEqual(0);
      expect(result.reportSubmissionRate).toBeLessThanOrEqual(100);
      expect(result.issueRecurrenceRate).toBeGreaterThanOrEqual(0);
      expect(result.issueRecurrenceRate).toBeLessThanOrEqual(100);
      expect(result.teamProductivityScore).toBeGreaterThanOrEqual(0);
      expect(result.teamProductivityScore).toBeLessThanOrEqual(100);

      // Verify that warning about same comparison period is emitted
      const warnCalls = warnSpy.mock.calls.concat(logSpy.mock.calls);
      const warningEmitted = warnCalls.some(callArgs =>
        callArgs[0]?.toString().includes('比較対象期間を異なる期間に変更してください')
      );

      expect(warningEmitted).toBe(true);
    } finally {
      warnSpy.mockRestore();
      logSpy.mockRestore();
    }
  });
});