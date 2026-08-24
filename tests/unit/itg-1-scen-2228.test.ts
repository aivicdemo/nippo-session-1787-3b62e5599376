import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Ranking - Deduplication and Normalization', () => {
  // SCEN-2228: [normal] 課題の重複検出と正規化 - 異なる表現で報告された同一課題（表記ゆれ）が検出され、正規化リストで統合される

  let mockTextAnalysisService: {
    extractKeywords: jest.Mock;
    assessImpactScore: jest.Mock;
    classifyIssueSeverity: jest.Mock;
  };

  beforeEach(() => {
    mockTextAnalysisService = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should detect and normalize duplicate keywords with different phrasings into a single ranked issue', async () => {
    // 課題正規化辞書に以下のマッピングを登録
    // 「DB接続エラー」「データベース接続失敗」「DB接続問題」→「正規化キー：DB_CONNECTION_ERROR」
    const normalizationMap = new Map<string, string>([
      ['DB接続エラー', 'DB_CONNECTION_ERROR'],
      ['データベース接続失敗', 'DB_CONNECTION_ERROR'],
      ['DB接続問題', 'DB_CONNECTION_ERROR'],
    ]);

    // TextAnalysisServiceAdapterをモック化
    // extractKeywordsメソッドが複数の表記ゆれを含む課題キーワードを返すよう設定
    mockTextAnalysisService.extractKeywords.mockResolvedValue({
      keywords: [
        { keyword: 'DB接続エラー', frequency: 1, impactScore: 75 },
        { keyword: 'データベース接続失敗', frequency: 1, impactScore: 78 },
        { keyword: 'DB接続問題', frequency: 1, impactScore: 72 },
      ],
    });

    // ユーザーA, B, C の日報から抽出された課題キーワード
    // ユーザーAが日報の「抱えている課題」に「DB接続エラーが発生している」と入力し送信
    // ユーザーBが日報の「抱えている課題」に「データベース接続失敗が原因で処理が停止中」と入力し送信
    // ユーザーCが日報の「抱えている課題」に「DB接続問題により検証が遅延」と入力し送信
    const extractInput: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-01T00:00:00Z'),
      endDate: new Date('2024-01-07T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'admin-001',
    };

    // 管理者がダッシュボードの課題一覧画面を開く
    // 重複検出・正規化処理が実行される
    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      extractInput,
      mockTextAnalysisService
    );

    // 期待結果の検証
    // ダッシュボードの課題一覧に「DB_CONNECTION_ERROR（3件）」として1つの統合された課題が表示される

    // 1. 統合後のキーワードリストに DB_CONNECTION_ERROR が含まれていることを確認
    const mergedKeyword = result.keywords.find(
      (k) => k.keyword === 'DB_CONNECTION_ERROR'
    );
    expect(mergedKeyword).toBeDefined();

    // 2. 3件全ての元のテキストが紐付けられていることを確認
    // 出現頻度は3であることを確認
    expect(mergedKeyword?.frequency).toBe(3);

    // 3. チーム波及度スコアは正規化前の各テキストの平均値 (75 + 78 + 72) / 3 = 75
    const expectedAverageImpactScore = (75 + 78 + 72) / 3;
    expect(mergedKeyword?.impactScore).toBeCloseTo(expectedAverageImpactScore, 1);

    // 4. ランキングが発生頻度でソートされていることを確認
    // 統合後の1つの課題がランク1であることを確認
    expect(mergedKeyword?.rank).toBe(1);

    // 5. 抽出結果メタデータの検証
    expect(result.totalKeywordCount).toBe(3);
    expect(result.extractedAt).toBeDefined();
    expect(result.analysisperiodDays).toBe(7);

    // 6. TextAnalysisServiceAdapter の extractKeywords メソッドが呼ばれたことを確認
    expect(mockTextAnalysisService.extractKeywords).toHaveBeenCalled();
  });
});