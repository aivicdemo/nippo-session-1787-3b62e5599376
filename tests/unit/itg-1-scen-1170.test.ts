import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import { type TextAnalysisServiceAdapter } from '../../src/services/text-analysis-service-adapter';

// SCEN-1170
describe('課題キーワード自動抽出・ランク付け機能', () => {
  test('各課題キーワードに信頼度スコアが付与される', async () => {
    // 準備: TextAnalysisServiceAdapterのスタブ
    const mockTextAnalysisAdapter: TextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: 'データベース', frequency: 3 },
          { keyword: '接続エラー', frequency: 2 },
        ],
      }),
      assessImpactScore: jest.fn()
        .mockResolvedValueOnce({ impactScore: 85 }) // データベース
        .mockResolvedValueOnce({ impactScore: 92 }), // 接続エラー
      classifyIssueSeverity: jest.fn(),
    };

    // 手順: 日報入力データ
    const reportText = 'データベース接続エラーが発生';
    const teamId = 'team-001';
    const startDate = new Date('2024-01-01T00:00:00Z');
    const endDate = new Date('2024-01-31T23:59:59Z');
    const requestUserId = 'user-001';

    // 実行
    const result = await extractAndRankIssueKeywords(
      {
        teamId,
        startDate,
        endDate,
        minFrequencyThreshold: 1,
        requestUserId,
      },
      mockTextAnalysisAdapter
    );

    // 検証: 抽出されたキーワードに信頼度スコアが付与されている
    expect(result.keywords).toHaveLength(2);
    
    // 最初のキーワード: データベース
    expect(result.keywords[0]).toEqual({
      keywordId: expect.any(String),
      keyword: 'データベース',
      frequency: 3,
      rank: 1,
      confidenceScore: 85,
    });
    expect(result.keywords[0].confidenceScore).toBeGreaterThanOrEqual(0);
    expect(result.keywords[0].confidenceScore).toBeLessThanOrEqual(100);

    // 2番目のキーワード: 接続エラー
    expect(result.keywords[1]).toEqual({
      keywordId: expect.any(String),
      keyword: '接続エラー',
      frequency: 2,
      rank: 2,
      confidenceScore: 92,
    });
    expect(result.keywords[1].confidenceScore).toBeGreaterThanOrEqual(0);
    expect(result.keywords[1].confidenceScore).toBeLessThanOrEqual(100);

    // 信頼度スコアが存在し、かつ指定範囲内であることを確認
    result.keywords.forEach((keyword) => {
      expect(typeof keyword.confidenceScore).toBe('number');
      expect(keyword.confidenceScore).toBeGreaterThanOrEqual(0);
      expect(keyword.confidenceScore).toBeLessThanOrEqual(100);
    });

    // メタデータの検証
    expect(result.totalKeywordCount).toBe(2);
    expect(result.extractedAt).toBeInstanceOf(Date);
    expect(result.analysisperiodDays).toBe(31);

    // 外部サービス呼び出しの検証
    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalledWith(
      reportText,
      teamId,
      startDate,
      endDate
    );
    expect(mockTextAnalysisAdapter.assessImpactScore).toHaveBeenCalledTimes(2);
  });
});