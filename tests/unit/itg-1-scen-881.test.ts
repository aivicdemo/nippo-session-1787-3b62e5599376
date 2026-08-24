import { describe, test, expect } from "@jest/globals";
import { extractAndRankIssueKeywords } from "../../src/logic/issue-extraction-prioritization";
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from "../../src/logic/issue-extraction-prioritization";

describe("課題キーワード自動抽出・頻度ランク付け機能", () => {
  // SCEN-881
  test("課題キーワードの発生頻度が0回のとき、ランク付け結果から除外される", () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockReturnValue({
        keywords: [
          {
            keyword: "データベース接続エラー",
            frequency: 0,
            impactScore: 45,
          },
          {
            keyword: "メモリ不足",
            frequency: 3,
            impactScore: 72,
          },
          {
            keyword: "タイムアウト",
            frequency: 2,
            impactScore: 60,
          },
          {
            keyword: "ネットワーク遅延",
            frequency: 0,
            impactScore: 55,
          },
        ],
      }),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: "team-001",
      startDate: new Date("2024-01-01T00:00:00Z"),
      endDate: new Date("2024-01-07T23:59:59Z"),
      minFrequencyThreshold: 1,
      requestUserId: "user-123",
    };

    const reportText =
      "チーム全体でメモリ不足の問題が多発しており、タイムアウトも頻繁に発生しています。";

    const result: RankedIssueKeywordList = extractAndRankIssueKeywords(
      input,
      mockTextAnalysisAdapter as any,
      reportText
    );

    expect(result.keywords).toHaveLength(2);
    expect(result.keywords.every((kw) => kw.frequency >= 1)).toBe(true);

    const hasZeroFrequencyKeyword = result.keywords.some(
      (kw) => kw.frequency === 0
    );
    expect(hasZeroFrequencyKeyword).toBe(false);

    const keywordTexts = result.keywords.map((kw) => kw.keyword);
    expect(keywordTexts).not.toContain("データベース接続エラー");
    expect(keywordTexts).not.toContain("ネットワーク遅延");
    expect(keywordTexts).toContain("メモリ不足");
    expect(keywordTexts).toContain("タイムアウト");

    expect(result.keywords[0].frequency).toBe(3);
    expect(result.keywords[0].keyword).toBe("メモリ不足");
    expect(result.keywords[1].frequency).toBe(2);
    expect(result.keywords[1].keyword).toBe("タイムアウト");

    expect(result.totalKeywordCount).toBe(4);
    expect(result.keywords[0].rank).toBe(1);
    expect(result.keywords[1].rank).toBe(2);

    expect(result.extractedAt).toBeInstanceOf(Date);
    expect(result.analysisperiodDays).toBe(7);
  });
});