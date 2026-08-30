import { analyzeIssuePatternsByTimeRange } from '../../src/logic/issue-pattern-analysis';
import { type IssuePatternAnalysisRequest, type IssuePatternVisualizationReport } from '../../src/logic/issue-pattern-analysis';

describe('Issue Pattern Analysis - Bottleneck Visualization', () => {
  test('SCEN-491: analyzeIssuePatternsByTimeRange normalizes impact scores to 0-100 range when input values are out of bounds', async () => {
    const now = new Date('2024-01-15T12:00:00Z');
    const thirtyDaysAgo = new Date('2023-12-16T12:00:00Z');

    const request: IssuePatternAnalysisRequest = {
      startDate: thirtyDaysAgo,
      endDate: now,
      periodGranularity: 'daily',
      teamId: null,
    };

    const result = await analyzeIssuePatternsByTimeRange(request);

    expect(result).toBeDefined();
    expect(result.reportId).toBeDefined();
    expect(typeof result.reportId).toBe('string');

    expect(result.analysisperiod).toEqual({
      startDate: thirtyDaysAgo,
      endDate: now,
      granularity: 'daily',
    });

    const allBottleneckScores = result.bottleneckProgression.timeSeriesPoints.map(
      (point) => point.priorityScore,
    );

    allBottleneckScores.forEach((score) => {
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    const allRecurrenceScores = result.recurrencePatterns.map(
      (pattern) => pattern.averageImpactScore,
    );

    allRecurrenceScores.forEach((score) => {
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    expect(result.visualizationCharts).toBeDefined();
    expect(Array.isArray(result.visualizationCharts)).toBe(true);

    expect(result.generatedAt).toBeDefined();
    expect(result.generatedAt instanceof Date).toBe(true);

    expect(result.recurrencePatterns).toBeDefined();
    expect(Array.isArray(result.recurrencePatterns)).toBe(true);

    expect(result.bottleneckProgression).toBeDefined();
    expect(result.bottleneckProgression.timeSeriesPoints).toBeDefined();
    expect(Array.isArray(result.bottleneckProgression.timeSeriesPoints)).toBe(true);
    expect(result.bottleneckProgression.priorityShiftEvents).toBeDefined();
    expect(Array.isArray(result.bottleneckProgression.priorityShiftEvents)).toBe(true);
  });
});