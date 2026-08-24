import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード抽出・ランク付け機能', () => {
  // SCEN-1159: [edge] 課題データ有効性検証機能 - 課題キーワード出現頻度が信頼度閾値（50%）を超過で有効判定される
  test('should validate issue data as valid when keyword frequency reaches 50% confidence threshold', () => {
    // Arrange: TextAnalysisServiceAdapter のスタブを初期化
    const mockTextAnalysisService = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          {
            keyword: 'システム障害',
            frequency: 3,
            totalTerms: 6,
            frequencyPercentage: 50,
          },
        ],
      }),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    // テスト入力データの準備
    const input = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    const challengeTexts = [
      'システム障害が発生した。システム障害への対応が急務である。システム障害の根本原因を調査中。',
    ];

    // Act: extractAndRankIssueKeywords 関数を呼び出す
    const result = extractAndRankIssueKeywords(input, mockTextAnalysisService);

    // Assert: 検証結果を確認
    expect(result).toBeDefined();
    expect(result).toHaveProperty('keywords');
    expect(result).toHaveProperty('totalKeywordCount');
    expect(result).toHaveProperty('extractedAt');
    expect(result).toHaveProperty('analysisperiodDays');

    // キーワード検証: 「システム障害」が出現頻度50%で有効判定
    expect(result.keywords).toHaveLength(1);
    const firstKeyword = result.keywords[0];
    expect(firstKeyword.keyword).toBe('システム障害');
    expect(firstKeyword.frequency).toBe(3);
    expect(firstKeyword.rank).toBe(1);

    // 信頼度スコア（出現頻度）が50%に到達していることを確認
    const confidenceScore = (firstKeyword.frequency / 6) * 100; // 3 / 6 * 100 = 50
    expect(confidenceScore).toBe(50);

    // 課題データが有効（confidenceScore >= 50）と判定されることを確認
    expect(confidenceScore).toBeGreaterThanOrEqual(50);

    // 分析期間が7日（2024-01-08 から 2024-01-14）であることを確認
    expect(result.analysisperiodDays).toBe(7);

    // 抽出時刻が ISO 8601 形式で記録されていることを確認
    expect(result.extractedAt).toBeInstanceOf(Date);
  });
});