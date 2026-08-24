import { analyzeBottleneckTrendWithTimeSeries } from '../../src/logic/monthly-performance-analysis';
import { type IssueTimeSeriesRecord, type BottleneckTrendAnalysisResult, type DailyTrendPoint } from '../../src/logic/monthly-performance-analysis';

describe('日報の課題項目から課題キーワードを自動抽出し、発生頻度でランク付けして表示する機能', () => {
  // SCEN-1939
  test('課題再発パターン時系列分析 - 日次期間区分で課題データが1件のみの場合、その1件の課題が日別に集計される', () => {
    const analysisStartDate = new Date('2026-08-20T00:00:00Z');
    const analysisEndDate = new Date('2026-08-20T23:59:59Z');

    const issueTimeSeriesData: IssueTimeSeriesRecord[] = [
      {
        issueId: 'ISSUE-001',
        recordDate: new Date('2026-08-20'),
        occurrenceCount: 1,
        impactScore: 75,
        resolutionDaysElapsed: 2,
        resolutionStatus: 'in_progress',
      },
    ];

    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockReturnValue({
        keywords: [{ keyword: 'ログイン機能の不具合', frequency: 1 }],
      }),
      assessImpactScore: jest.fn().mockReturnValue({ impactScore: 75 }),
      classifyIssueSeverity: jest.fn().mockReturnValue({ severity: 'high' }),
    };

    const result = analyzeBottleneckTrendWithTimeSeries(
      analysisStartDate,
      analysisEndDate,
      issueTimeSeriesData,
      7,
      true
    );

    expect(result).toBeDefined();
    expect(result.issueId).toBe('ISSUE-001');
    expect(result.bottleneckSeverityScore).toBeGreaterThanOrEqual(0);
    expect(result.bottleneckSeverityScore).toBeLessThanOrEqual(100);
    expect(result.bottleneckSeverityRank).toMatch(/critical|high|medium|low/);
    expect(result.averageResolutionDays).toBeGreaterThanOrEqual(0);
    expect(result.peakOccurrenceDate).toEqual(new Date('2026-08-20'));
    expect(result.timeSeriesTrendData).toBeDefined();
    expect(Array.isArray(result.timeSeriesTrendData)).toBe(true);
    expect(result.timeSeriesTrendData.length).toBeGreaterThan(0);

    const dailyTrendPoint = result.timeSeriesTrendData[0];
    expect(dailyTrendPoint.date).toEqual(new Date('2026-08-20'));
    expect(dailyTrendPoint.occurrenceCount).toBe(1);
    expect(dailyTrendPoint.impactScore).toBe(75);
    expect(typeof dailyTrendPoint.resolutionRate).toBe('number');
    expect(dailyTrendPoint.resolutionRate).toBeGreaterThanOrEqual(0);
    expect(dailyTrendPoint.resolutionRate).toBeLessThanOrEqual(100);
  });
});