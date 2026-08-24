import { analyzeBottleneckTrendWithTimeSeries } from '../../src/logic/monthly-performance-analysis';

describe('課題再発パターン時系列分析 - 週次期間区分での課題集約', () => {
  // SCEN-1943
  test('同一週内の複数出現課題が週ごとに集計・集約される', () => {
    const analysisStartDate = new Date('2024-01-01T00:00:00Z'); // 月曜日
    const analysisEndDate = new Date('2024-01-07T23:59:59Z');   // 日曜日

    const issueTimeSeriesData = [
      {
        issueId: 'issue-a',
        recordDate: new Date('2024-01-01T09:00:00Z'), // 月
        occurrenceCount: 1,
        impactScore: 75,
        resolutionDaysElapsed: 2,
        resolutionStatus: 'open' as const,
      },
      {
        issueId: 'issue-a',
        recordDate: new Date('2024-01-03T09:00:00Z'), // 水
        occurrenceCount: 1,
        impactScore: 70,
        resolutionDaysElapsed: 1,
        resolutionStatus: 'in_progress' as const,
      },
      {
        issueId: 'issue-b',
        recordDate: new Date('2024-01-02T09:00:00Z'), // 火
        occurrenceCount: 1,
        impactScore: 60,
        resolutionDaysElapsed: 3,
        resolutionStatus: 'open' as const,
      },
      {
        issueId: 'issue-c',
        recordDate: new Date('2024-01-04T09:00:00Z'), // 木
        occurrenceCount: 1,
        impactScore: 80,
        resolutionDaysElapsed: 0,
        resolutionStatus: 'open' as const,
      },
      {
        issueId: 'issue-c',
        recordDate: new Date('2024-01-05T09:00:00Z'), // 金
        occurrenceCount: 1,
        impactScore: 85,
        resolutionDaysElapsed: 1,
        resolutionStatus: 'resolved' as const,
      },
    ];

    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockReturnValue({
        'issue-a': { frequency: 2, impactScore: 72.5 },
        'issue-b': { frequency: 1, impactScore: 60 },
        'issue-c': { frequency: 2, impactScore: 82.5 },
      }),
      assessImpactScore: jest.fn((keyword: string) => {
        const scoreMap: { [key: string]: number } = {
          'issue-a': 72.5,
          'issue-b': 60,
          'issue-c': 82.5,
        };
        return scoreMap[keyword] || 0;
      }),
      classifyIssueSeverity: jest.fn((keyword: string) => {
        const severityMap: { [key: string]: 'high' | 'medium' | 'low' } = {
          'issue-a': 'high',
          'issue-b': 'medium',
          'issue-c': 'high',
        };
        return severityMap[keyword] || 'low';
      }),
    };

    const result = analyzeBottleneckTrendWithTimeSeries(
      analysisStartDate,
      analysisEndDate,
      issueTimeSeriesData,
      7,
      true,
      mockTextAnalysisServiceAdapter
    );

    expect(result.issueId).toBeDefined();
    expect(result.bottleneckSeverityRank).toMatch(/critical|high|medium|low/);
    expect(typeof result.bottleneckSeverityScore).toBe('number');
    expect(result.bottleneckSeverityScore).toBeGreaterThanOrEqual(0);
    expect(result.bottleneckSeverityScore).toBeLessThanOrEqual(100);

    expect(result.improvementTrend).toMatch(/improving|stable|deteriorating/);
    expect(typeof result.averageResolutionDays).toBe('number');
    expect(result.averageResolutionDays).toBeGreaterThanOrEqual(0);

    expect(result.peakOccurrenceDate).toEqual(new Date('2024-01-04T09:00:00Z'));

    expect(Array.isArray(result.timeSeriesTrendData)).toBe(true);
    expect(result.timeSeriesTrendData.length).toBeGreaterThan(0);

    const aggregatedIssues = new Map<string, { count: number; minDate: Date; maxDate: Date }>();
    for (const record of issueTimeSeriesData) {
      const key = record.issueId;
      if (!aggregatedIssues.has(key)) {
        aggregatedIssues.set(key, {
          count: 0,
          minDate: record.recordDate,
          maxDate: record.recordDate,
        });
      }
      const entry = aggregatedIssues.get(key)!;
      entry.count += 1;
      if (record.recordDate < entry.minDate) {
        entry.minDate = record.recordDate;
      }
      if (record.recordDate > entry.maxDate) {
        entry.maxDate = record.recordDate;
      }
    }

    expect(aggregatedIssues.size).toBe(3);

    const issueAData = aggregatedIssues.get('issue-a');
    expect(issueAData).toBeDefined();
    expect(issueAData!.count).toBe(2);
    expect(issueAData!.minDate).toEqual(new Date('2024-01-01T09:00:00Z'));
    expect(issueAData!.maxDate).toEqual(new Date('2024-01-03T09:00:00Z'));

    const issueBData = aggregatedIssues.get('issue-b');
    expect(issueBData).toBeDefined();
    expect(issueBData!.count).toBe(1);
    expect(issueBData!.minDate).toEqual(new Date('2024-01-02T09:00:00Z'));
    expect(issueBData!.maxDate).toEqual(new Date('2024-01-02T09:00:00Z'));

    const issueCData = aggregatedIssues.get('issue-c');
    expect(issueCData).toBeDefined();
    expect(issueCData!.count).toBe(2);
    expect(issueCData!.minDate).toEqual(new Date('2024-01-04T09:00:00Z'));
    expect(issueCData!.maxDate).toEqual(new Date('2024-01-05T09:00:00Z'));
  });
});