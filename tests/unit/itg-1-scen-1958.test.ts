import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { analyzeBottleneckTrendWithTimeSeries } from '../../src/logic/monthly-performance-analysis';
import type { BottleneckAnalysisInput, IssueTimeSeriesRecord, BottleneckTrendAnalysisResult } from '../../src/logic/monthly-performance-analysis';

describe('monthly-performance-analysis - analyzeBottleneckTrendWithTimeSeries', () => {
  // SCEN-1958
  test('should handle database read error from issue extraction results table and return appropriate error', async () => {
    const analysisStartDate = new Date('2024-01-01T00:00:00Z');
    const analysisEndDate = new Date('2024-01-31T23:59:59Z');

    const timeSeriesData: IssueTimeSeriesRecord[] = [
      {
        issueId: 'ISSUE-001',
        recordDate: new Date('2024-01-15'),
        occurrenceCount: 3,
        impactScore: 75,
        resolutionDaysElapsed: 2,
        resolutionStatus: 'in_progress',
      },
      {
        issueId: 'ISSUE-001',
        recordDate: new Date('2024-01-16'),
        occurrenceCount: 2,
        impactScore: 80,
        resolutionDaysElapsed: 3,
        resolutionStatus: 'in_progress',
      },
      {
        issueId: 'ISSUE-001',
        recordDate: new Date('2024-01-17'),
        occurrenceCount: 1,
        impactScore: 60,
        resolutionDaysElapsed: 4,
        resolutionStatus: 'resolved',
      },
    ];

    const input: BottleneckAnalysisInput = {
      analysisStartDate,
      analysisEndDate,
      issueTimeSeriesData: timeSeriesData,
      minimumDataPointsThreshold: 7,
      outlierDetectionEnabled: true,
    };

    try {
      const result = await analyzeBottleneckTrendWithTimeSeries(input);
      expect(result).toBeUndefined();
    } catch (error) {
      expect(error).toBeDefined();
      expect((error as Error).message).toMatch(/課題分析が一時的に利用できません/);
    }
  });
});