import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { extractAndRankIssueKeywords } from "../../src/logic/issue-extraction-prioritization";
import type {
  ExtractIssueKeywordsInput,
  RankedIssueKeywordList,
  RankedIssueKeyword,
} from "../../src/logic/issue-extraction-prioritization";

describe("extractAndRankIssueKeywords", () => {
  // SCEN-2379: [edge] 課題発生頻度の定量化 - 集約期間内で課題キーワードの出現頻度が同値のとき、すべての課題を同順位として扱う
  test("should rank all keywords with equal frequency as rank 1 when frequencies are identical", () => {
    // Arrange
    const mockTextAnalysisService = {
      extractKeywords: jest.fn((text: string) => {
        if (text.includes("サーバー障害")) {
          return Promise.resolve([
            { keyword: "サーバー障害", frequency: 3 },
          ]);
        }
        if (text.includes("ネットワーク遅延")) {
          return Promise.resolve([
            { keyword: "ネットワーク遅延", frequency: 3 },
          ]);
        }
        if (text.includes("デプロイ失敗")) {
          return Promise.resolve([
            { keyword: "デプロイ失敗", frequency: 3 },
          ]);
        }
        return Promise.resolve([]);
      }),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: "team-001",
      startDate: new Date("2026-01-01T00:00:00Z"),
      endDate: new Date("2026-01-31T23:59:59Z"),
      minFrequencyThreshold: 1,
      requestUserId: "user-001",
    };

    const mockReports = [
      {
        reportId: "report-001",
        reportDate: new Date("2026-01-05T09:00:00Z"),
        teamId: "team-001",
        content: "サーバー障害が発生した",
      },
      {
        reportId: "report-002",
        reportDate: new Date("2026-01-12T09:00:00Z"),
        teamId: "team-001",
        content: "ネットワーク遅延が発生した",
      },
      {
        reportId: "report-003",
        reportDate: new Date("2026-01-20T09:00:00Z"),
        teamId: "team-001",
        content: "デプロイ失敗が発生した",
      },
    ];

    // Act
    const result = extractAndRankIssueKeywords(
      input,
      mockTextAnalysisService,
      mockReports
    );

    // Assert
    expect(result).toBeDefined();
    expect(result.keywords).toHaveLength(3);

    // Verify all keywords have rank 1
    const allKeywordsRank1 = result.keywords.every(
      (kw: RankedIssueKeyword) => kw.rank === 1
    );
    expect(allKeywordsRank1).toBe(true);

    // Verify keywords are present
    const keywordTexts = result.keywords.map((kw: RankedIssueKeyword) =>
      kw.keyword
    );
    expect(keywordTexts).toContain("サーバー障害");
    expect(keywordTexts).toContain("ネットワーク遅延");
    expect(keywordTexts).toContain("デプロイ失敗");

    // Verify all keywords have frequency 3
    result.keywords.forEach((kw: RankedIssueKeyword) => {
      expect(kw.frequency).toBe(3);
    });

    // Verify extracted timestamp and analysis period
    expect(result.extractedAt).toBeDefined();
    expect(result.analysisperiodDays).toBe(31);
    expect(result.totalKeywordCount).toBe(3);
  });
});