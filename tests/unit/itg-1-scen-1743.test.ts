import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード自動抽出・優先度スコア算出機能', () => {
  // SCEN-1743: 影響度スコアが境界値（50/100）のとき優先度表示が切り替わる
  test('影響度スコアが50（境界値）のとき、優先度が中優先度に分類される', async () => {
    // Setup: TextAnalysisServiceAdapterのモック
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ['データベース接続タイムアウト'],
        frequencies: [1],
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        keyword: 'データベース接続タイムアウト',
        impactScore: 50, // 境界値: 低優先度(0-49)と中優先度(50-100)の境界
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        keyword: 'データベース接続タイムアウト',
        severity: 'medium',
      }),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-08T00:00:00Z'),
      endDate: new Date('2024-01-14T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-001',
    };

    // Execute: 課題キーワード自動抽出・優先度スコア算出機能を実行
    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisAdapter
    );

    // Assert: 影響度スコア50で優先度が中優先度に分類されることを検証
    expect(result).toBeDefined();
    expect(result.keywords).toHaveLength(1);
    
    const rankedKeyword = result.keywords[0];
    expect(rankedKeyword.keyword).toBe('データベース接続タイムアウト');
    expect(rankedKeyword.frequency).toBe(1);
    expect(rankedKeyword.rank).toBe(1);

    // 優先度スコアが50で中優先度に分類されることを確認
    // スコア計算: 発生頻度スコア(0-40) + 影響度スコア(0-40) + 解決難度スコア(0-20) の配分
    // 影響度スコア50の場合、優先度スコアは中優先度の閾値(40以上)に該当する
    expect(rankedKeyword.priorityScore).toBeGreaterThanOrEqual(40);
    expect(rankedKeyword.priorityScore).toBeLessThanOrEqual(70);
    expect(rankedKeyword.priorityRank).toBe('中');

    // メール配信用の色コードが黄色であることを確認
    expect(rankedKeyword.colorCode).toBe('#FFFF00');

    // Mock呼び出しの検証
    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalledTimes(1);
    expect(mockTextAnalysisAdapter.assessImpactScore).toHaveBeenCalledTimes(1);
    expect(mockTextAnalysisAdapter.assessImpactScore).toHaveBeenCalledWith(
      expect.objectContaining({
        keyword: 'データベース接続タイムアウト',
      })
    );

    // 抽出日時が記録されていることを確認
    expect(result.extractedAt).toBeInstanceOf(Date);
    expect(result.analysisperiodDays).toBe(7);
  });
});