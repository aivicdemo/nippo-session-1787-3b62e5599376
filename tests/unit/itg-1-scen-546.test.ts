import { describe, test, expect } from "@jest/globals";
import { extractAndRankIssueKeywords } from "../../src/logic/issue-extraction-prioritization";
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from "../../src/logic/issue-extraction-prioritization";

describe("課題キーワード自動抽出・優先度判定機能", () => {
  // SCEN-546: 影響度スコアがちょうど上限（100）の課題が最高優先度として順序付けられる
  test("should rank issue keyword with impact score 100 at the highest priority position", async () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: async (text: string) => {
        // テストデータ: 複数の課題キーワードを異なる頻度で返す
        if (text.includes("システムダウン")) {
          return { keywords: ["システムダウン"], frequency: { "システムダウン": 3 } };
        }
        if (text.includes("パフォーマンス低下")) {
          return { keywords: ["パフォーマンス低下"], frequency: { "パフォーマンス低下": 2 } };
        }
        if (text.includes("データ不整合")) {
          return { keywords: ["データ不整合"], frequency: { "データ不整合": 1 } };
        }
        return { keywords: [], frequency: {} };
      },
      assessImpactScore: async (keyword: string): Promise<number> => {
        // 課題キーワードごとに異なるスコアを返す
        const scoreMap: Record<string, number> = {
          "システムダウン": 100,      // 最高スコア（上限）
          "パフォーマンス低下": 85,   // 中スコア
          "データ不整合": 70,         // 低スコア
        };
        return scoreMap[keyword] ?? 0;
      },
      classifyIssueSeverity: async (content: string) => {
        return "high";
      },
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: "team-001",
      startDate: new Date("2024-01-01T00:00:00Z"),
      endDate: new Date("2024-01-07T23:59:59Z"),
      minFrequencyThreshold: 1,
      requestUserId: "user-001",
    };

    const multipleReportsText = `
      1. Yesterday we encountered システムダウン in production environment
      2. Also noticed パフォーマンス低下 in API response times
      3. Minor issue with データ不整合 in cached records
    `;

    // 関数呼び出し
    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisAdapter
    );

    // assertion: 影響度スコア100の課題キーワードが最初に位置していること
    expect(result.keywords).toBeDefined();
    expect(result.keywords.length).toBeGreaterThan(0);
    
    // 最初の要素が最高スコア（100）の課題であること
    const firstKeyword = result.keywords[0];
    expect(firstKeyword.keyword).toBe("システムダウン");
    expect(firstKeyword.frequency).toBe(3);
    expect(firstKeyword.rank).toBe(1);

    // スコア順に降順でソートされていることを確認
    if (result.keywords.length > 1) {
      const secondKeyword = result.keywords[1];
      expect(secondKeyword.keyword).toBe("パフォーマンス低下");
      expect(secondKeyword.rank).toBe(2);
    }

    if (result.keywords.length > 2) {
      const thirdKeyword = result.keywords[2];
      expect(thirdKeyword.keyword).toBe("データ不整合");
      expect(thirdKeyword.rank).toBe(3);
    }

    // 総抽出キーワード数を確認
    expect(result.totalKeywordCount).toBeGreaterThanOrEqual(1);
    
    // 抽出実行日時が記録されていること
    expect(result.extractedAt).toBeInstanceOf(Date);
    
    // 分析対象期間の日数を確認
    expect(result.analysisperiodDays).toBe(7);
  });
});