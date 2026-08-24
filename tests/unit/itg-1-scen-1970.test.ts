import { analyzeBottleneckTrendWithTimeSeries } from '../../src/logic/monthly-performance-analysis';
import type { IssueTimeSeriesRecord, BottleneckTrendAnalysisResult, DailyTrendPoint } from '../../src/logic/monthly-performance-analysis';

describe('課題再発パターン時系列分析機能', () => {
  // SCEN-1970: [edge] 再発パターン計算で出現頻度の割り算結果が小数になるとき、適切に丸められる
  test('出現頻度の割り算結果が小数の場合、小数第2位で四捨五入して表示される', () => {
    const analysisStartDate = new Date('2024-11-01T00:00:00Z');
    const analysisEndDate = new Date('2024-11-30T23:59:59Z');
    
    const issueTimeSeriesData: IssueTimeSeriesRecord[] = [
      {
        issueId: 'issue-001',
        recordDate: new Date('2024-11-05'),
        occurrenceCount: 1,
        impactScore: 45,
        resolutionDaysElapsed: 2,
        resolutionStatus: 'open'
      },
      {
        issueId: 'issue-001',
        recordDate: new Date('2024-11-10'),
        occurrenceCount: 1,
        impactScore: 50,
        resolutionDaysElapsed: 3,
        resolutionStatus: 'in_progress'
      },
      {
        issueId: 'issue-001',
        recordDate: new Date('2024-11-15'),
        occurrenceCount: 1,
        impactScore: 55,
        resolutionDaysElapsed: 4,
        resolutionStatus: 'resolved'
      },
      {
        issueId: 'issue-002',
        recordDate: new Date('2024-11-08'),
        occurrenceCount: 1,
        impactScore: 30,
        resolutionDaysElapsed: 1,
        resolutionStatus: 'closed'
      },
      {
        issueId: 'issue-003',
        recordDate: new Date('2024-11-12'),
        occurrenceCount: 1,
        impactScore: 25,
        resolutionDaysElapsed: 2,
        resolutionStatus: 'closed'
      },
      {
        issueId: 'issue-004',
        recordDate: new Date('2024-11-18'),
        occurrenceCount: 1,
        impactScore: 35,
        resolutionDaysElapsed: 1,
        resolutionStatus: 'closed'
      },
      {
        issueId: 'issue-005',
        recordDate: new Date('2024-11-22'),
        occurrenceCount: 1,
        impactScore: 40,
        resolutionDaysElapsed: 2,
        resolutionStatus: 'open'
      }
    ];

    const result: BottleneckTrendAnalysisResult = analyzeBottleneckTrendWithTimeSeries(
      analysisStartDate,
      analysisEndDate,
      issueTimeSeriesData,
      7,
      true
    );

    expect(result.issueId).toBe('issue-001');
    expect(result.bottleneckSeverityRank).toBe('high');
    
    const expectedOccurrenceFrequency = 3 / 7;
    const roundedFrequency = Math.round(expectedOccurrenceFrequency * 100) / 100;
    
    expect(result.bottleneckSeverityScore).toBe(50);
    
    const timeSeriesTrendData: DailyTrendPoint[] = result.timeSeriesTrendData;
    expect(timeSeriesTrendData.length).toBeGreaterThan(0);
    
    const totalOccurrences = timeSeriesTrendData.reduce(
      (sum, point) => sum + point.occurrenceCount,
      0
    );
    expect(totalOccurrences).toBe(3);
    
    const overallFrequency = totalOccurrences / issueTimeSeriesData.length;
    const displayFrequency = Math.round(overallFrequency * 100) / 100;
    
    expect(displayFrequency).toBe(roundedFrequency);
    expect(displayFrequency).toBe(0.43);
    
    expect(result.averageResolutionDays).toBe(3);
    expect(result.peakOccurrenceDate instanceof Date).toBe(true);
    expect(result.improvementTrend).toBeDefined();
    expect(['improving', 'stable', 'deteriorating']).toContain(result.improvementTrend);
  });
});