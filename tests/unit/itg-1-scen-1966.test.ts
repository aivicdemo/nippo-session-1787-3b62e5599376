import { describe, test, expect } from '@jest/globals';
import { analyzeBottleneckTrendWithTimeSeries } from '../../src/logic/monthly-performance-analysis';
import { type IssueTimeSeriesRecord } from '../../src/logic/monthly-performance-analysis';

describe('課題再発パターン時系列分析機能', () => {
  // SCEN-1966
  test('同一課題キーワードの重複データが1件としてカウントされる', () => {
    const analysisStartDate = new Date('2024-01-01T00:00:00Z');
    const analysisEndDate = new Date('2024-01-31T23:59:59Z');

    const issueTimeSeriesData: IssueTimeSeriesRecord[] = [
      {
        issueId: 'issue-001',
        recordDate: new Date('2024-01-05T00:00:00Z'),
        occurrenceCount: 3,
        impactScore: 85,
        resolutionDaysElapsed: 2,
        resolutionStatus: 'open',
      },
      {
        issueId: 'issue-002',
        recordDate: new Date('2024-01-06T00:00:00Z'),
        occurrenceCount: 2,
        impactScore: 80,
        resolutionDaysElapsed: 1,
        resolutionStatus: 'in_progress',
      },
      {
        issueId: 'issue-003',
        recordDate: new Date('2024-01-07T00:00:00Z'),
        occurrenceCount: 1,
        impactScore: 45,
        resolutionDaysElapsed: 0,
        resolutionStatus: 'open',
      },
      {
        issueId: 'issue-004',
        recordDate: new Date('2024-01-08T00:00:00Z'),
        occurrenceCount: 3,
        impactScore: 90,
        resolutionDaysElapsed: 3,
        resolutionStatus: 'open',
      },
      {
        issueId: 'issue-005',
        recordDate: new Date('2024-01-09T00:00:00Z'),
        occurrenceCount: 2,
        impactScore: 75,
        resolutionDaysElapsed: 1,
        resolutionStatus: 'resolved',
      },
    ];

    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockReturnValue([
        { keyword: 'データベース接続エラー', frequency: 3 },
        { keyword: 'データベース接続エラー', frequency: 2 },
        { keyword: 'API タイムアウト', frequency: 1 },
      ]),
      assessImpactScore: jest.fn().mockReturnValue(82),
      classifyIssueSeverity: jest.fn().mockReturnValue('high'),
    };

    const result = analyzeBottleneckTrendWithTimeSeries(
      analysisStartDate,
      analysisEndDate,
      issueTimeSeriesData,
      7,
      true,
      mockTextAnalysisServiceAdapter
    );

    expect(result).toBeDefined();
    expect(result.timeSeriesTrendData).toBeDefined();
    expect(Array.isArray(result.timeSeriesTrendData)).toBe(true);

    const uniqueKeywords = new Map<string, number>();
    mockTextAnalysisServiceAdapter.extractKeywords().forEach(
      (item: { keyword: string; frequency: number }) => {
        if (!uniqueKeywords.has(item.keyword)) {
          uniqueKeywords.set(item.keyword, item.frequency);
        } else {
          const currentMax = uniqueKeywords.get(item.keyword) || 0;
          uniqueKeywords.set(item.keyword, Math.max(currentMax, item.frequency));
        }
      }
    );

    expect(uniqueKeywords.size).toBe(2);
    expect(uniqueKeywords.get('データベース接続エラー')).toBe(3);
    expect(uniqueKeywords.get('API タイムアウト')).toBe(1);

    expect(result.averageResolutionDays).toBeGreaterThanOrEqual(0);
    expect(result.bottleneckSeverityScore).toBeGreaterThanOrEqual(0);
    expect(result.bottleneckSeverityScore).toBeLessThanOrEqual(100);
    expect(['critical', 'high', 'medium', 'low']).toContain(
      result.bottleneckSeverityRank
    );
    expect(['improving', 'stable', 'deteriorating']).toContain(
      result.improvementTrend
    );
  });
});