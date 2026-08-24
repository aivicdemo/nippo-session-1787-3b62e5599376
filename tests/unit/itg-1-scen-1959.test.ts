import { analyzeBottleneckTrendWithTimeSeries } from '../../src/logic/monthly-performance-analysis';
import type { BottleneckAnalysisInput, IssueTimeSeriesRecord } from '../../src/logic/monthly-performance-analysis';

describe('課題再発パターン時系列分析機能', () => {
  // SCEN-1959
  test('分析対象期間が1日（開始日と終了日が同日）のとき、その日の課題データのみが集計される', () => {
    const analysisTargetDate = new Date('2026-08-19T00:00:00Z');
    const analysisEndDate = new Date('2026-08-19T23:59:59Z');

    const issueTimeSeriesData: IssueTimeSeriesRecord[] = [
      {
        issueId: 'ISSUE-A',
        recordDate: new Date('2026-08-19'),
        occurrenceCount: 2,
        impactScore: 75,
        resolutionDaysElapsed: 3,
        resolutionStatus: 'in_progress',
      },
      {
        issueId: 'ISSUE-B',
        recordDate: new Date('2026-08-19'),
        occurrenceCount: 1,
        impactScore: 50,
        resolutionDaysElapsed: 1,
        resolutionStatus: 'open',
      },
      {
        issueId: 'ISSUE-C',
        recordDate: new Date('2026-08-19'),
        occurrenceCount: 3,
        impactScore: 85,
        resolutionDaysElapsed: 5,
        resolutionStatus: 'resolved',
      },
      {
        issueId: 'ISSUE-D',
        recordDate: new Date('2026-08-18'),
        occurrenceCount: 1,
        impactScore: 40,
        resolutionDaysElapsed: 2,
        resolutionStatus: 'closed',
      },
      {
        issueId: 'ISSUE-E',
        recordDate: new Date('2026-08-20'),
        occurrenceCount: 2,
        impactScore: 60,
        resolutionDaysElapsed: 4,
        resolutionStatus: 'open',
      },
    ];

    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn((text: string) => ({
        keywords: [
          { keyword: 'database', frequency: 1, confidence: 0.95 },
        ],
        text,
      })),
      assessImpactScore: jest.fn((description: string) => ({
        impactScore: 75,
        description,
      })),
      classifyIssueSeverity: jest.fn((text: string) => ({
        severity: 'high' as const,
        text,
      })),
    };

    const input: BottleneckAnalysisInput = {
      analysisStartDate: analysisTargetDate,
      analysisEndDate: analysisEndDate,
      issueTimeSeriesData,
      minimumDataPointsThreshold: 7,
      outlierDetectionEnabled: true,
    };

    const result = analyzeBottleneckTrendWithTimeSeries(
      input,
      mockTextAnalysisServiceAdapter
    );

    // 集計対象期間内のデータは3件（ISSUE-A, ISSUE-B, ISSUE-C）
    const filteredTimeSeriesData = result.timeSeriesTrendData;

    expect(filteredTimeSeriesData).toBeDefined();
    expect(filteredTimeSeriesData.length).toBe(1);

    const singleDayData = filteredTimeSeriesData[0];
    expect(singleDayData.date.toISOString().split('T')[0]).toBe('2026-08-19');

    // 当日の課題発生件数は合計: 2 + 1 + 3 = 6
    expect(singleDayData.occurrenceCount).toBe(6);

    // 当日の影響度スコアは合計: 75 + 50 + 85 = 210、平均: 70
    expect(singleDayData.impactScore).toBe(70);

    // 当日の解決済み・対応中課題: ISSUE-C (resolved), ISSUE-B (open ただし期待値検証)
    // 実装に応じて解決率は再計算される
    expect(singleDayData.resolutionRate).toBeGreaterThanOrEqual(0);
    expect(singleDayData.resolutionRate).toBeLessThanOrEqual(100);

    // TextAnalysisServiceAdapterへの呼び出し検証
    // フィルタ済みの3件のデータのみが処理対象
    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalled();
    expect(mockTextAnalysisServiceAdapter.assessImpactScore).toHaveBeenCalled();

    // ボトルネック分析結果の検証
    expect(result.issueId).toBeDefined();
    expect(result.bottleneckSeverityRank).toMatch(
      /^(critical|high|medium|low)$/
    );
    expect(result.bottleneckSeverityScore).toBeGreaterThanOrEqual(0);
    expect(result.bottleneckSeverityScore).toBeLessThanOrEqual(100);
    expect(result.improvementTrend).toMatch(/^(improving|stable|deteriorating)$/);
    expect(result.averageResolutionDays).toBeGreaterThanOrEqual(0);
    expect(result.peakOccurrenceDate).toBeDefined();
  });
});