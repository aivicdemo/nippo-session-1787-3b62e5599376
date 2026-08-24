import { describe, test, expect, beforeEach } from "@jest/globals";
import { extractAndRankIssueKeywords } from "../../src/logic/issue-extraction-prioritization";
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from "../../src/logic/issue-extraction-prioritization";

describe("課題キーワード自動抽出・ランク付け機能", () => {
  // SCEN-1294
  test("複数件の日報から課題キーワードが全件抽出され、発生頻度でランク付けされて表示される", () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: "データベース", frequency: 2 },
          { keyword: "ネットワーク遅延", frequency: 2 },
          { keyword: "ログ", frequency: 2 },
          { keyword: "接続エラー", frequency: 1 },
          { keyword: "テスト", frequency: 1 },
        ],
        totalCount: 5,
      }),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: "team-001",
      startDate: new Date("2024-01-08T00:00:00Z"),
      endDate: new Date("2024-01-10T23:59:59Z"),
      minFrequencyThreshold: 1,
      requestUserId: "user-manager-001",
    };

    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisAdapter
    );

    expect(result.keywords).toHaveLength(5);
    expect(result.keywords[0]).toEqual({
      keyword: "データベース",
      frequency: 2,
      rank: 1,
    });
    expect(result.keywords[1]).toEqual({
      keyword: "ネットワーク遅延",
      frequency: 2,
      rank: 2,
    });
    expect(result.keywords[2]).toEqual({
      keyword: "ログ",
      frequency: 2,
      rank: 3,
    });
    expect(result.keywords[3]).toEqual({
      keyword: "接続エラー",
      frequency: 1,
      rank: 4,
    });
    expect(result.keywords[4]).toEqual({
      keyword: "テスト",
      frequency: 1,
      rank: 5,
    });

    expect(result.totalKeywordCount).toBe(5);
    expect(result.extractedAt).toBeInstanceOf(Date);
    expect(result.analysisperiodDays).toBe(3);
  });
});