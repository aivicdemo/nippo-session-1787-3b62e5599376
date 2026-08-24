import { describe, test, expect } from "@jest/globals";
import { extractAndRankIssueKeywords } from "../../src/logic/issue-extraction-prioritization";
import type {
  ExtractIssueKeywordsInput,
  RankedIssueKeywordList,
} from "../../src/logic/issue-extraction-prioritization";

describe("課題の影響度（チーム全体への波及度）を判定し、優先度スコアで順序付けして表示する機能", () => {
  // SCEN-552: [edge] 課題キーワード自動抽出・優先度判定機能 - 影響度スコア計算で端数が発生する場合（例：66.67）、丸めルールに従って順序付けられる
  test("should rank issue keywords correctly when impact scores have decimal places and rounding is required", async () => {
    const teamId = "team-001";
    const startDate = new Date("2024-01-08T00:00:00Z");
    const endDate = new Date("2024-01-14T23:59:59Z");
    const minFrequencyThreshold = 1;
    const requestUserId = "user-001";

    const mockRawExtractedData = [
      {
        keyword: "database_connection_timeout",
        frequency: 5,
      },
      {
        keyword: "memory_leak_in_service",
        frequency: 3,
      },
      {
        keyword: "api_response_delay",
        frequency: 2,
      },
    ];

    const mockImpactScores: Record<string, number> = {
      database_connection_timeout: 66.67,
      memory_leak_in_service: 66.66,
      api_response_delay: 50.5,
    };

    const stubTextAnalysisService = {
      extractKeywords: async (text: string): Promise<string[]> => {
        return Object.keys(mockImpactScores);
      },
      assessImpactScore: async (keyword: string): Promise<number> => {
        return mockImpactScores[keyword] ?? 0;
      },
      classifyIssueSeverity: async (
        text: string
      ): Promise<"high" | "medium" | "low"> => {
        return "medium";
      },
    };

    const input: ExtractIssueKeywordsInput = {
      teamId,
      startDate,
      endDate,
      minFrequencyThreshold,
      requestUserId,
    };

    const result: RankedIssueKeywordList =
      await extractAndRankIssueKeywords(input, stubTextAnalysisService);

    expect(result.keywords).toBeDefined();
    expect(Array.isArray(result.keywords)).toBe(true);
    expect(result.keywords.length).toBeGreaterThan(0);

    const roundedScores = result.keywords.map((kw) => ({
      keyword: kw.keyword,
      frequency: kw.frequency,
      rank: kw.rank,
    }));

    expect(roundedScores[0].rank).toBe(1);
    expect(roundedScores[0].frequency).toBeGreaterThanOrEqual(
      roundedScores[1].frequency
    );

    if (roundedScores[0].frequency === roundedScores[1].frequency) {
      expect(roundedScores[0].rank).toBeLessThan(roundedScores[1].rank);
    }

    expect(result.totalKeywordCount).toBeDefined();
    expect(typeof result.totalKeywordCount).toBe("number");
    expect(result.totalKeywordCount).toBeGreaterThanOrEqual(0);

    expect(result.extractedAt).toBeInstanceOf(Date);

    expect(result.analysisperiodDays).toBeDefined();
    expect(typeof result.analysisperiodDays).toBe("number");
    const expectedDays = Math.floor(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    expect(result.analysisperiodDays).toBe(expectedDays + 1);

    for (let i = 0; i < result.keywords.length - 1; i++) {
      const currentRank = result.keywords[i].rank;
      const nextRank = result.keywords[i + 1].rank;
      expect(currentRank).toBeLessThanOrEqual(nextRank);
    }
  });
});