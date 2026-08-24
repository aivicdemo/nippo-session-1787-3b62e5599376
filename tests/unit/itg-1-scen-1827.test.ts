import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { analyzeBottleneckTrendWithTimeSeries } from '../../src/logic/monthly-performance-analysis';
import type { BottleneckAnalysisInput, IssueTimeSeriesRecord, BottleneckTrendAnalysisResult } from '../../src/logic/monthly-performance-analysis';

describe('ボトルネック推移集計機能 - 波及度スコア影響度判定', () => {
  // SCEN-1827: 波及度スコア50のとき中程度ボトルネックに分類される
  test('波及度スコア50の課題を中程度ボトルネック（MEDIUM）に分類する', () => {
    const analysisStartDate = new Date('2024-01-01T00:00:00Z');
    const analysisEndDate = new Date('2024-01-31T23:59:59Z');

    const issueTimeSeriesData: IssueTimeSeriesRecord[] = [
      {
        issueId: 'ISSUE-001',
        recordDate: new Date('2024-01-15T00:00:00Z'),
        occurrenceCount: 3,
        impactScore: 50,
        resolutionDaysElapsed: 2,
        resolutionStatus: 'in_progress'
      },
      {
        issueId: 'ISSUE-001',
        recordDate: new Date('2024-01-16T00:00:00Z'),
        occurrenceCount: 2,
        impactScore: 50,
        resolutionDaysElapsed: 3,
        resolutionStatus: 'in_progress'
      },
      {
        issueId: 'ISSUE-001',
        recordDate: new Date('2024-01-17T00:00:00Z'),
        occurrenceCount: 1,
        impactScore: 50,
        resolutionDaysElapsed: 4,
        resolutionStatus: 'resolved'
      }
    ];

    const input: BottleneckAnalysisInput = {
      analysisStartDate,
      analysisEndDate,
      issueTimeSeriesData,
      minimumDataPointsThreshold: 3,
      outlierDetectionEnabled: true
    };

    const result: BottleneckTrendAnalysisResult = analyzeBottleneckTrendWithTimeSeries(input);

    expect(result.issueId).toBe('ISSUE-001');
    expect(result.bottleneckSeverityRank).toBe('medium');
    expect(result.bottleneckSeverityScore).toBe(50);
    expect(result.averageResolutionDays).toBe(3);
    expect(result.timeSeriesTrendData).toHaveLength(3);
    expect(result.timeSeriesTrendData[0]).toEqual({
      date: new Date('2024-01-15T00:00:00Z'),
      occurrenceCount: 3,
      impactScore: 50,
      resolutionRate: 0
    });
    expect(result.timeSeriesTrendData[1]).toEqual({
      date: new Date('2024-01-16T00:00:00Z'),
      occurrenceCount: 2,
      impactScore: 50,
      resolutionRate: 0
    });
    expect(result.timeSeriesTrendData[2]).toEqual({
      date: new Date('2024-01-17T00:00:00Z'),
      occurrenceCount: 1,
      impactScore: 50,
      resolutionRate: 100
    });
  });
});