import { describe, test, expect } from "@jest/globals";
import { extractAndRankIssueKeywords } from "../../src/logic/issue-extraction-prioritization";

describe("課題キーワード自動抽出・頻度ランク付け機能", () => {
  // SCEN-1904
  test("検索結果の時系列順序が逆転している場合、正しい時系列順に修正される", async () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          {
            keyword: "接続エラー",
            timestamp: "2026-08-19T10:30:00Z",
            frequency: 3,
          },
          {
            keyword: "DB遅延",
            timestamp: "2026-08-19T09:15:00Z",
            frequency: 5,
          },
          {
            keyword: "メモリ不足",
            timestamp: "2026-08-19T08:00:00Z",
            frequency: 2,
          },
        ],
      }),
    };

    const input = {
      teamId: "team-001",
      startDate: new Date("2026-08-19T00:00:00Z"),
      endDate: new Date("2026-08-19T23:59:59Z"),
      minFrequencyThreshold: 1,
      requestUserId: "user-001",
    };

    const result = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisServiceAdapter
    );

    expect(result.keywords).toHaveLength(3);
    expect(result.keywords[0].keyword).toBe("メモリ不足");
    expect(result.keywords[0].timestamp).toBe("2026-08-19T08:00:00Z");
    expect(result.keywords[0].frequency).toBe(2);
    expect(result.keywords[1].keyword).toBe("DB遅延");
    expect(result.keywords[1].timestamp).toBe("2026-08-19T09:15:00Z");
    expect(result.keywords[1].frequency).toBe(5);
    expect(result.keywords[2].keyword).toBe("接続エラー");
    expect(result.keywords[2].timestamp).toBe("2026-08-19T10:30:00Z");
    expect(result.keywords[2].frequency).toBe(3);
  });
});