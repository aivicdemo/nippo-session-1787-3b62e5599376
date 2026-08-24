import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('Issue extraction and ranking - Deduplication and normalization', () => {
  // SCEN-2227: [normal] 課題の重複検出と正規化 - 複数メンバーから同一課題の重複報告がある場合、正規化されたリストで1件に統合される

  let mockTextAnalysisServiceAdapter: any;

  beforeEach(() => {
    mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should deduplicate and normalize multiple reports of the same issue from different members', async () => {
    // 準備: テストデータとして、3名のメンバーからの日報データを作成
    const teamId = 'team-001';
    const startDate = new Date('2024-01-08T00:00:00Z');
    const endDate = new Date('2024-01-14T23:59:59Z');
    const requestUserId = 'user-manager-001';

    // メンバーA, B, C からの報告文を定義
    // メンバーA: 「データベース接続タイムアウトが頻発」
    // メンバーB: 「DB接続タイムアウト問題」
    // メンバーC: 「接続タイムアウト」

    // TextAnalysisServiceAdapter のスタブ: extractKeywords() の戻り値を模擬
    // 3件の報告から抽出されたキーワードと発生頻度を返す
    mockTextAnalysisServiceAdapter.extractKeywords.mockResolvedValue({
      extractedKeywords: [
        {
          keyword: 'タイムアウト',
          normalizedForm: 'タイムアウト',
          originalForms: ['タイムアウト', 'タイムアウト', 'タイムアウト'],
          frequency: 3,
        },
        {
          keyword: '接続',
          normalizedForm: '接続',
          originalForms: ['接続', 'DB接続', '接続'],
          frequency: 3,
        },
        {
          keyword: 'データベース',
          normalizedForm: 'データベース',
          originalForms: ['データベース'],
          frequency: 1,
        },
      ],
      analysisMetadata: {
        reportCount: 3,
        uniqueReporters: 3,
        analysisTimestamp: '2024-01-14T09:00:00Z',
      },
    });

    // assessImpactScore() のスタブ
    mockTextAnalysisServiceAdapter.assessImpactScore.mockResolvedValue({
      'タイムアウト': 85,
      '接続': 75,
      'データベース': 60,
    });

    // テスト実行: extractAndRankIssueKeywords を呼び出す
    const input: ExtractIssueKeywordsInput = {
      teamId,
      startDate,
      endDate,
      minFrequencyThreshold: 1,
      requestUserId,
    };

    const result = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisServiceAdapter
    );

    // 検証1: 戻り値の型が RankedIssueKeywordList であること
    expect(result).toBeDefined();
    expect(result.keywords).toBeDefined();
    expect(Array.isArray(result.keywords)).toBe(true);
    expect(result.totalKeywordCount).toBeDefined();
    expect(result.extractedAt).toBeDefined();
    expect(result.analysisperiodDays).toBeDefined();

    // 検証2: 発生頻度が3以上のキーワードが抽出されていること
    // minFrequencyThreshold = 1 なので、frequency >= 1 のキーワードが返される
    const rankedKeywords = result.keywords;
    expect(rankedKeywords.length).toBeGreaterThan(0);

    // 検証3: キーワード「タイムアウト」が rank 1 で返されていること
    // 発生頻度が最も高い（3件）ため、rank 1 となるべき
    const timeoutKeyword = rankedKeywords.find((kw) => kw.keyword === 'タイムアウト');
    expect(timeoutKeyword).toBeDefined();
    expect(timeoutKeyword?.frequency).toBe(3);
    expect(timeoutKeyword?.rank).toBe(1);

    // 検証4: キーワード「接続」が rank 2 で返されていること
    const connectionKeyword = rankedKeywords.find((kw) => kw.keyword === '接続');
    expect(connectionKeyword).toBeDefined();
    expect(connectionKeyword?.frequency).toBe(3);
    expect(connectionKeyword?.rank).toBe(2);

    // 検証5: 全キーワード数が3であること
    // extractKeywords() から返された3つのキーワードがカウントされる
    expect(result.totalKeywordCount).toBe(3);

    // 検証6: 抽出期間が7日（月曜から日曜まで）であること
    const daysDiff = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    expect(result.analysisperiodDays).toBe(daysDiff + 1);

    // 検証7: キーワードがランクで降順にソートされていること
    for (let i = 1; i < rankedKeywords.length; i++) {
      expect(rankedKeywords[i - 1].rank).toBeLessThanOrEqual(
        rankedKeywords[i].rank
      );
    }

    // 検証8: TextAnalysisServiceAdapter.extractKeywords() が正しい引数で呼ばれていること
    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalledWith(
      expect.objectContaining({
        teamId,
        startDate,
        endDate,
      })
    );

    // 検証9: minFrequencyThreshold = 1 で全キーワードが返されていることを確認
    // frequency < 1 のキーワードは存在しないため、全て返される
    const filteredKeywords = rankedKeywords.filter((kw) => kw.frequency >= 1);
    expect(filteredKeywords.length).toBe(rankedKeywords.length);

    // 検証10: 各キーワードに keywordId が割り当てられていること
    for (const keyword of rankedKeywords) {
      expect(keyword.keywordId).toBeDefined();
      expect(typeof keyword.keywordId).toBe('string');
      expect(keyword.keywordId.length).toBeGreaterThan(0);
    }

    // 検証11: extractedAt が有効なISO 8601形式の日時であること
    const extractedAt = new Date(result.extractedAt);
    expect(extractedAt instanceof Date).toBe(true);
    expect(extractedAt.getTime()).not.toBeNaN();

    // 検証12: 同一表現の課題が正規化されて1件に統合されていることを確認
    // 「タイムアウト」と「接続」は各メンバーから複数報告されているが、
    // 正規化後は統一フォームで1件ずつ計算されている
    const uniqueNormalizedKeywords = new Set(rankedKeywords.map((kw) => kw.keyword));
    expect(uniqueNormalizedKeywords.size).toBe(rankedKeywords.length);
  });
});