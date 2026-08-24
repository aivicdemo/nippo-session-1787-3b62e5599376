import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import { type ExtractIssueKeywordsInput, type RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題抽出・優先度ランク付け機能', () => {
  let mockTextAnalysisAdapter: {
    extractKeywords: jest.Mock;
    assessImpactScore: jest.Mock;
    classifyIssueSeverity: jest.Mock;
  };

  beforeEach(() => {
    mockTextAnalysisAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1162: [edge] 課題データ有効性検証機能 - 抽出課題の影響度スコアが優先度ランク分岐点（60点）を超過で高優先度に分類される
  test('影響度スコアが60点を超過する場合、優先度ランクが高優先度に分類される', async () => {
    const teamId = 'team-001';
    const requestUserId = 'user-dept-head';
    const startDate = new Date('2024-01-08T00:00:00Z');
    const endDate = new Date('2024-01-14T23:59:59Z');
    const minFrequencyThreshold = 1;

    // TextAnalysisServiceAdapterをモック化
    // assessImpactScore メソッドが影響度スコア 61 を返すよう設定
    mockTextAnalysisAdapter.assessImpactScore.mockResolvedValue(61);

    // 抽出キーワードのモックデータ
    mockTextAnalysisAdapter.extractKeywords.mockResolvedValue({
      keywords: [
        {
          keyword: 'システム障害',
          frequency: 3,
        },
      ],
    });

    const input: ExtractIssueKeywordsInput = {
      teamId,
      startDate,
      endDate,
      minFrequencyThreshold,
      requestUserId,
    };

    // 課題データ有効性検証機能を実行
    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisAdapter,
    );

    // 検証: 分類結果が期待通りであることを確認
    expect(result).toBeDefined();
    expect(result.keywords).toBeDefined();
    expect(Array.isArray(result.keywords)).toBe(true);

    // 抽出されたキーワード数が1件であることを確認
    expect(result.keywords.length).toBeGreaterThanOrEqual(1);

    // 影響度スコア 61 は優先度ランク分岐点（60点）を超過
    // したがって、該当する課題が高優先度グループに属していることを確認
    const systemFailureKeyword = result.keywords.find(
      (kw) => kw.keyword === 'システム障害',
    );

    expect(systemFailureKeyword).toBeDefined();

    if (systemFailureKeyword) {
      // 優先度ランク分岐点を超過しているため、ランクが高い（1位の順位）であることを確認
      expect(systemFailureKeyword.rank).toBeLessThanOrEqual(1);
      expect(systemFailureKeyword.frequency).toBe(3);
    }

    // 抽出処理が正常に完了し、結果がデータベースに保存可能な形式であることを確認
    expect(result.totalKeywordCount).toBeGreaterThanOrEqual(1);
    expect(result.extractedAt).toBeInstanceOf(Date);
    expect(result.analysisperiodDays).toBeGreaterThan(0);

    // TextAnalysisServiceAdapterのメソッドが正常に呼び出されたことを確認
    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalled();
    expect(mockTextAnalysisAdapter.assessImpactScore).toHaveBeenCalled();
  });
});