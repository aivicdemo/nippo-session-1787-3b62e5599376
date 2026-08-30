import { analyzeIssuePatternsByTimeRange } from '../../src/logic/issue-pattern-analysis';

describe('朝会報告管理システム - 課題パターン分析', () => {
  // SCEN-096: 指定された日付範囲内の過去課題データから再発パターンを時系列で分析し、ボトルネック変化を可視化レポートとして出力する
  test('analyzeIssuePatternsByTimeRange - 正常系：期間内の再発パターンをボトルネック推移と共に可視化レポートで出力', () => {
    const startDate = new Date('2024-01-01T00:00:00Z');
    const endDate = new Date('2024-03-31T23:59:59Z');
    const periodGranularity = 'weekly';
    const teamId = null;

    const result = analyzeIssuePatternsByTimeRange({
      startDate,
      endDate,
      periodGranularity,
      teamId,
    });

    expect(result).toBeDefined();
    expect(typeof result.reportId).toBe('string');
    expect(result.reportId.length).toBeGreaterThan(0);

    expect(result.analysisperiod).toBeDefined();
    expect(result.analysisperiod.startDate).toEqual(startDate);
    expect(result.analysisperiod.endDate).toEqual(endDate);
    expect(result.analysisperiod.granularity).toBe('weekly');

    expect(Array.isArray(result.recurrencePatterns)).toBe(true);
    expect(result.recurrencePatterns.length).toBeGreaterThanOrEqual(0);

    if (result.recurrencePatterns.length > 0) {
      const pattern = result.recurrencePatterns[0];
      expect(typeof pattern.issueKeyword).toBe('string');
      expect(typeof pattern.occurrenceCount).toBe('number');
      expect(pattern.occurrenceCount).toBeGreaterThan(0);
      expect(Array.isArray(pattern.recurrenceIntervalDays)).toBe(true);
      expect(typeof pattern.averageImpactScore).toBe('number');
      expect(pattern.averageImpactScore).toBeGreaterThanOrEqual(0);
      expect(pattern.averageImpactScore).toBeLessThanOrEqual(100);
    }

    expect(result.bottleneckProgression).toBeDefined();
    expect(Array.isArray(result.bottleneckProgression.timeSeriesPoints)).toBe(true);

    if (result.bottleneckProgression.timeSeriesPoints.length > 0) {
      const point = result.bottleneckProgression.timeSeriesPoints[0];
      expect(point.timestamp instanceof Date).toBe(true);
      expect(typeof point.topBottleneckIssue).toBe('string');
      expect(typeof point.priorityScore).toBe('number');
      expect(point.priorityScore).toBeGreaterThanOrEqual(0);
      expect(point.priorityScore).toBeLessThanOrEqual(100);
    }

    expect(Array.isArray(result.bottleneckProgression.priorityShiftEvents)).toBe(true);

    if (result.bottleneckProgression.priorityShiftEvents.length > 0) {
      const event = result.bottleneckProgression.priorityShiftEvents[0];
      expect(typeof event.fromIssue).toBe('string');
      expect(typeof event.toIssue).toBe('string');
      expect(event.shiftDate instanceof Date).toBe(true);
      expect(typeof event.reason).toBe('string');
    }

    expect(Array.isArray(result.visualizationCharts)).toBe(true);

    expect(result.generatedAt instanceof Date).toBe(true);
  });
});