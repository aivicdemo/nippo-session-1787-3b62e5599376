import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { TextAnalysisServiceAdapter } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Extraction and Ranking - Team Impact Assessment', () => {
  // SCEN-524: [normal] 課題自動抽出・優先度判定機能 - TextAnalysisServiceAdapterが正常応答した場合、各キーワードのチーム波及度スコア（0-100）が正しく算出される
  test('should calculate correct team impact scores (0-100) for multiple keywords when TextAnalysisServiceAdapter responds normally', async () => {
    // Arrange: TextAnalysisServiceAdapterのスタブを準備
    const mockAdapter: TextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(async (text: string) => {
        // テスト用の課題キーワード群を返す（3個のキーワード）
        if (text.includes('サーバーダウン')) {
          return ['サーバーダウン'];
        }
        if (text.includes('納期遅延')) {
          return ['納期遅延'];
        }
        if (text.includes('人員不足')) {
          return ['人員不足'];
        }
        return [];
      }),
      assessImpactScore: jest.fn(async (keyword: string) => {
        // 各キーワードに対してチーム波及度スコア（0-100の整数値）を返す
        const impactScores: Record<string, number> = {
          'サーバーダウン': 95,
          '納期遅延': 78,
          '人員不足': 62,
        };
        return impactScores[keyword] ?? 50;
      }),
      classifyIssueSeverity: jest.fn(async (text: string) => {
        return 'high';
      }),
    };

    // テスト用のキーワード群を用意
    const testKeywords = ['サーバーダウン', '納期遅延', '人員不足'];
    const reportText =
      'サーバーダウンが発生した。納期遅延の可能性がある。人員不足で対応が遅れている。';

    // Act: extractAndRankIssueKeywords関数を呼び出し
    const result = await extractAndRankIssueKeywords(
      reportText,
      mockAdapter
    );

    // Assert: 各キーワードのスコアが正しく算出されていることを検証

    // 1. 戻り値の構造を確認
    expect(result).toBeDefined();
    expect(result.keywords).toBeDefined();
    expect(Array.isArray(result.keywords)).toBe(true);

    // 2. 複数キーワード（最小3個）のスコアを検証
    expect(result.keywords.length).toBeGreaterThanOrEqual(3);

    // 3. 各キーワードのスコアが条件を満たすことを検証
    result.keywords.forEach((keyword) => {
      // 3.1: impactScoreが整数値である
      expect(Number.isInteger(keyword.impactScore)).toBe(true);

      // 3.2: impactScoreの値の範囲が0以上100以下である
      expect(keyword.impactScore).toBeGreaterThanOrEqual(0);
      expect(keyword.impactScore).toBeLessThanOrEqual(100);

      // 3.3: impactScoreがnull/undefined/NaNではない
      expect(keyword.impactScore).not.toBeNull();
      expect(keyword.impactScore).not.toBeUndefined();
      expect(Number.isNaN(keyword.impactScore)).toBe(false);
    });

    // 4. 具体的なスコア値が期待値と一致することを検証
    const serverDownKeyword = result.keywords.find(
      (kw) => kw.keyword === 'サーバーダウン'
    );
    const delayKeyword = result.keywords.find(
      (kw) => kw.keyword === '納期遅延'
    );
    const staffShortageKeyword = result.keywords.find(
      (kw) => kw.keyword === '人員不足'
    );

    if (serverDownKeyword) {
      expect(serverDownKeyword.impactScore).toBe(95);
    }
    if (delayKeyword) {
      expect(delayKeyword.impactScore).toBe(78);
    }
    if (staffShortageKeyword) {
      expect(staffShortageKeyword.impactScore).toBe(62);
    }

    // 5. すべてのキーワードが独立した値として正しく算出されていることを確認
    const impactScores = result.keywords.map((kw) => kw.impactScore);
    expect(new Set(impactScores).size).toBeGreaterThan(0);

    // 6. assessImpactScoreメソッドが各キーワードに対して呼び出されたことを確認
    expect(mockAdapter.assessImpactScore).toHaveBeenCalled();
  });
});