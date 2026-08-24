import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード抽出・ランク付け機能', () => {
  // SCEN-1878
  test('指定された日付範囲内でキーワードにマッチする課題が1件の場合、その課題が検索結果として返される', async () => {
    // Arrange: テストデータの準備
    const teamId = 'team-001';
    const requestUserId = 'user-manager-001';
    const startDate = new Date('2026-08-10T00:00:00Z');
    const endDate = new Date('2026-08-20T23:59:59Z');
    const minFrequencyThreshold = 1;

    const input: ExtractIssueKeywordsInput = {
      teamId,
      startDate,
      endDate,
      minFrequencyThreshold,
      requestUserId,
    };

    // モックデータ: 期間内に報告された日報から抽出される課題キーワード
    const mockExtractedKeywords = [
      {
        keywordId: 'keyword-db-connection',
        keyword: 'データベース接続',
        frequency: 1,
      },
    ];

    // TextAnalysisServiceAdapter のモック化
    const mockTextAnalysisService = {
      extractKeywords: jest.fn().mockResolvedValue(mockExtractedKeywords),
      assessImpactScore: jest.fn().mockResolvedValue(75),
      classifyIssueSeverity: jest.fn().mockResolvedValue('中'),
    };

    // Act: 課題キーワード抽出・ランク付け機能を呼び出す
    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisService
    );

    // Assert: 戻り値を検証
    expect(result).toBeDefined();
    expect(result.keywords).toBeInstanceOf(Array);
    expect(result.keywords.length).toBe(1);

    // 検索結果に含まれる課題の属性を検証
    const foundKeyword = result.keywords[0];
    expect(foundKeyword.keywordId).toBe('keyword-db-connection');
    expect(foundKeyword.keyword).toBe('データベース接続');
    expect(foundKeyword.frequency).toBe(1);
    expect(foundKeyword.rank).toBe(1);

    // 全体統計を検証
    expect(result.totalKeywordCount).toBe(1);
    expect(result.analysisperiodDays).toBe(11); // 2026-08-10 から 2026-08-20 までの日数
    expect(result.extractedAt).toBeInstanceOf(Date);

    // モックが正しく呼ばれたことを確認
    expect(mockTextAnalysisService.extractKeywords).toHaveBeenCalledWith({
      teamId,
      startDate,
      endDate,
    });
  });
});