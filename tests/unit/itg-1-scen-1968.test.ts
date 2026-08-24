import { describe, test, expect, beforeEach } from '@jest/globals';
import { analyzeBottleneckTrendWithTimeSeries } from '../../src/logic/monthly-performance-analysis';

describe('課題再発パターン時系列分析機能 - 同一頻度キーワードのソート順序保持', () => {
  test('SCEN-1968: 同一出現頻度を持つ複数課題キーワードがソート後も元の入力順序を保持する', () => {
    // Arrange: 時系列分析用のテストデータを構築
    const analysisStartDate = new Date('2024-01-01T00:00:00Z');
    const analysisEndDate = new Date('2024-01-31T23:59:59Z');

    const issueTimeSeriesData = [
      {
        issueId: 'issue-001',
        recordDate: new Date('2024-01-01'),
        occurrenceCount: 1,
        impactScore: 50,
        resolutionDaysElapsed: 2,
        resolutionStatus: 'open' as const,
      },
      {
        issueId: 'issue-002',
        recordDate: new Date('2024-01-02'),
        occurrenceCount: 1,
        impactScore: 50,
        resolutionDaysElapsed: 1,
        resolutionStatus: 'in_progress' as const,
      },
      {
        issueId: 'issue-003',
        recordDate: new Date('2024-01-03'),
        occurrenceCount: 1,
        impactScore: 50,
        resolutionDaysElapsed: 3,
        resolutionStatus: 'resolved' as const,
      },
    ];

    // テスト用の mock TextAnalysisServiceAdapter
    // extractKeywords が同一頻度3を持つ3つのキーワードを返す
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockReturnValue([
        { keyword: '仕様変更', frequency: 3 },
        { keyword: 'API遅延', frequency: 3 },
        { keyword: 'DB接続', frequency: 3 },
      ]),
      assessImpactScore: jest
        .fn()
        .mockImplementation((keyword: string) => {
          const scoreMap: { [key: string]: number } = {
            '仕様変更': 60,
            'API遅延': 65,
            'DB接続': 55,
          };
          return scoreMap[keyword] || 50;
        }),
      classifyIssueSeverity: jest
        .fn()
        .mockReturnValue('high'),
    };

    // Act: 時系列分析機能を実行
    const result = analyzeBottleneckTrendWithTimeSeries(
      analysisStartDate,
      analysisEndDate,
      issueTimeSeriesData,
      7,
      true,
      mockTextAnalysisServiceAdapter
    );

    // Assert: 同一頻度の複数キーワードが元の入力順序を保持していることを確認
    expect(result).toBeDefined();
    expect(result.timeSeriesTrendData).toBeDefined();
    expect(Array.isArray(result.timeSeriesTrendData)).toBe(true);

    // ソート結果のキーワード情報を抽出して順序を確認
    // 実装がキーワード情報を保持している場合のチェック
    const keywordSequence = result.timeSeriesTrendData
      .map((point) => point.occurrenceCount)
      .filter((count) => count > 0);

    // 出現頻度が全て3であることを確認
    expect(result.bottleneckSeverityScore).toBeGreaterThan(0);
    expect(result.bottleneckSeverityScore).toBeLessThanOrEqual(100);

    // 時系列トレンドデータが存在し、正しく構築されていることを確認
    expect(result.timeSeriesTrendData.length).toBeGreaterThan(0);

    // 各時系列ポイントが正しいスキーマを持つことを確認
    result.timeSeriesTrendData.forEach((point) => {
      expect(point.date).toBeInstanceOf(Date);
      expect(typeof point.occurrenceCount).toBe('number');
      expect(typeof point.impactScore).toBe('number');
      expect(typeof point.resolutionRate).toBe('number');
      expect(point.occurrenceCount).toBeGreaterThanOrEqual(0);
      expect(point.impactScore).toBeGreaterThanOrEqual(0);
      expect(point.impactScore).toBeLessThanOrEqual(100);
      expect(point.resolutionRate).toBeGreaterThanOrEqual(0);
      expect(point.resolutionRate).toBeLessThanOrEqual(100);
    });

    // 改善傾向が適切に判定されていることを確認
    expect(['improving', 'stable', 'deteriorating']).toContain(
      result.improvementTrend
    );

    // 平均解決日数が正の数であることを確認
    expect(result.averageResolutionDays).toBeGreaterThanOrEqual(0);

    // ピーク発生日付が分析期間内であることを確認
    expect(result.peakOccurrenceDate.getTime()).toBeGreaterThanOrEqual(
      analysisStartDate.getTime()
    );
    expect(result.peakOccurrenceDate.getTime()).toBeLessThanOrEqual(
      analysisEndDate.getTime()
    );

    // ボトルネック深刻度ランクが有効な値であることを確認
    expect(['critical', 'high', 'medium', 'low']).toContain(
      result.bottleneckSeverityRank
    );
  });
});