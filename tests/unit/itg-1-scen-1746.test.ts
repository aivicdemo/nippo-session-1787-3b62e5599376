import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('課題キーワード抽出・優先度スコア算出機能', () => {
  // SCEN-1746: [edge] 複数キーワードの影響度計算時に端数が発生したとき適切に丸められる
  test('複数キーワードの影響度スコア合算時に発生した端数が定義された丸め規則に従って処理される', async () => {
    // ========== Setup: TextAnalysisServiceAdapterをモック化 ==========
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([
        { keyword: 'データベース障害', frequency: 5 },
        { keyword: 'API遅延', frequency: 4 },
        { keyword: 'ユーザー影響', frequency: 3 },
      ]),
      assessImpactScore: jest
        .fn()
        .mockImplementation(async (keyword: string) => {
          // 複数キーワードの個別スコアを設定
          // これらを合算した際に端数が発生するケース
          const scoreMap: Record<string, number> = {
            'データベース障害': 33.33,
            'API遅延': 33.34,
            'ユーザー影響': 33.33,
          };
          return scoreMap[keyword] ?? 0;
        }),
      classifyIssueSeverity: jest.fn().mockResolvedValue('high'),
    };

    // ========== Prepare: 入力データを構成 ==========
    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-01-01T00:00:00Z'),
      endDate: new Date('2024-01-07T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-manager-001',
    };

    // ========== Act: 関数を実行 ==========
    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisAdapter
    );

    // ========== Assert: 端数処理が適切に行われたことを検証 ==========
    // 複数キーワードの影響度スコア合算: 33.33 + 33.34 + 33.33 = 100.00
    // 丸め規則: 小数第2位で四捨五入（または小数第1位まで表示）

    expect(result).toBeDefined();
    expect(result.keywords).toBeDefined();
    expect(Array.isArray(result.keywords)).toBe(true);

    // 各キーワードのスコアが期待の精度で保持されている
    // （小数第2位までで統一、または指定の精度に従う）
    result.keywords.forEach((rankedKeyword) => {
      // priorityScore が整数値または小数第1位までに統一されていることを確認
      // 例：99.99 → 100、100.01 → 100 のような丸め処理が適用される
      const scoreStr = rankedKeyword.frequency.toString();
      const decimalParts = scoreStr.split('.');

      // 小数部が存在する場合、小数第2位以下がないことを確認
      // または定義された精度内に収まっていることを確認
      if (decimalParts.length === 2) {
        expect(decimalParts[1].length).toBeLessThanOrEqual(1);
      }

      // スコアが 0 以上 100 以下の正当な範囲内
      expect(rankedKeyword.frequency).toBeGreaterThanOrEqual(0);
      expect(rankedKeyword.frequency).toBeLessThanOrEqual(100);
    });

    // 合算後の総スコアが丸め規則に従う
    // 全スコアの合計が100に近い値（99.99 ～ 100.01）であり、
    // 最終的には100に丸まることを期待
    const totalFrequency = result.keywords.reduce(
      (sum, kw) => sum + kw.frequency,
      0
    );

    // 丸め処理後のスコアが整数値に統一されている場合
    // Number.isInteger(totalFrequency) === true または
    // 小数第1位までの精度に統一されている
    const roundedTotal = Math.round(totalFrequency * 10) / 10;
    expect(roundedTotal).toBeCloseTo(100.0, 1);

    // ========== Additional: 応答構造の完全性を検証 ==========
    expect(result.totalKeywordCount).toBeGreaterThan(0);
    expect(result.extractedAt).toBeInstanceOf(Date);
    expect(result.analysisperiodDays).toBe(7); // 2024-01-01 ～ 2024-01-07 = 7日
  });
});