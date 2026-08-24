import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import { type ExtractIssueKeywordsInput, type RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・優先度スコア算出機能', () => {
  test('SCEN-1742: 発生頻度が閾値超過（例：週6件）のキーワードが上位ランクに分類される', () => {
    // Arrange: TextAnalysisServiceAdapterをモック化
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    // モック設定: 同一キーワード「サーバー障害」が過去7日間に週6件出現したデータを返す
    // 同期間に出現頻度が週3件以下のキーワード3件も並行して返す
    const mockExtractedKeywords = [
      {
        keyword: 'サーバー障害',
        frequency: 6,
        documentIds: ['doc1', 'doc2', 'doc3', 'doc4', 'doc5', 'doc6'],
      },
      {
        keyword: 'データベース接続エラー',
        frequency: 3,
        documentIds: ['doc7', 'doc8', 'doc9'],
      },
      {
        keyword: 'ネットワークタイムアウト',
        frequency: 2,
        documentIds: ['doc10', 'doc11'],
      },
      {
        keyword: 'メモリ不足警告',
        frequency: 1,
        documentIds: ['doc12'],
      },
    ];

    mockTextAnalysisAdapter.extractKeywords.mockReturnValue(
      mockExtractedKeywords
    );

    // テスト入力パラメータ
    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-15T00:00:00Z'),
      endDate: new Date('2024-01-21T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    // Act: 朝会報告管理システムの優先度スコア算出ロジックを実行
    const result: RankedIssueKeywordList =
      extractAndRankIssueKeywords(input, mockTextAnalysisAdapter);

    // Assert: 算出結果から『サーバー障害』キーワードの優先度ランクを確認
    const serverIssueKeyword = result.keywords.find(
      (kw) => kw.keyword === 'サーバー障害'
    );
    expect(serverIssueKeyword).toBeDefined();
    expect(serverIssueKeyword?.rank).toBeLessThanOrEqual(2);
    expect(serverIssueKeyword?.frequency).toBe(6);

    // Assert: 同期間の週3件以下キーワード群の優先度ランクを確認
    const lowFrequencyKeywords = result.keywords.filter(
      (kw) => kw.frequency <= 3 && kw.keyword !== 'サーバー障害'
    );

    // Assert: 『サーバー障害』が週3件以下キーワード群より上位ランクに分類されていることを検証
    expect(lowFrequencyKeywords.length).toBeGreaterThan(0);
    lowFrequencyKeywords.forEach((lowFreqKw) => {
      expect(serverIssueKeyword!.rank).toBeLessThan(lowFreqKw.rank);
    });

    // Assert: キーワード総数と抽出日時の検証
    expect(result.keywords.length).toBe(4);
    expect(result.totalKeywordCount).toBe(4);
    expect(result.extractedAt).toBeInstanceOf(Date);
    expect(result.analysisperiodDays).toBe(7);

    // Assert: ランク順序が発生頻度の降順に整列していることを検証
    for (let i = 0; i < result.keywords.length - 1; i++) {
      expect(result.keywords[i].rank).toBeLessThan(result.keywords[i + 1].rank);
      expect(result.keywords[i].frequency).toBeGreaterThanOrEqual(
        result.keywords[i + 1].frequency
      );
    }
  });
});