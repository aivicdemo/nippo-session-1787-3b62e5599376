import { describe, test, expect, beforeEach } from "@jest/globals";
import { extractAndRankIssueKeywords } from "../../src/logic/issue-extraction-prioritization";
import { type TextAnalysisServiceAdapter } from "../../src/logic/issue-extraction-prioritization";

describe("課題自動抽出・優先度判定機能", () => {
  // SCEN-462: [edge] 課題自動抽出・優先度判定機能 - チーム波及度スコアが99（100未満）と判定された課題は、100の課題より後に優先順位付けされる
  test("should rank issue with impact score 100 before issue with impact score 99", async () => {
    const mockTextAnalysisServiceAdapter: TextAnalysisServiceAdapter = {
      extractKeywords: async (text: string) => {
        if (text.includes("A") && text.includes("B")) {
          return [
            { keyword: "A", frequency: 1 },
            { keyword: "B", frequency: 1 },
          ];
        }
        return [];
      },
      assessImpactScore: async (keyword: string) => {
        if (keyword === "A") {
          return 99;
        }
        if (keyword === "B") {
          return 100;
        }
        return 0;
      },
      classifyIssueSeverity: async (text: string) => {
        return "medium";
      },
    };

    const reportText = "課題A: システム不安定 課題B: 重大バグ";
    const analysisStartDate = new Date("2024-01-01T00:00:00Z");
    const analysisEndDate = new Date("2024-01-31T23:59:59Z");

    const result = await extractAndRankIssueKeywords(
      {
        teamId: "team-001",
        startDate: analysisStartDate,
        endDate: analysisEndDate,
        minFrequencyThreshold: 1,
        requestUserId: "user-001",
      },
      mockTextAnalysisServiceAdapter
    );

    expect(result.keywords).toHaveLength(2);
    expect(result.keywords[0].keyword).toBe("B");
    expect(result.keywords[0].rank).toBe(1);
    expect(result.keywords[0].frequency).toBe(1);
    expect(result.keywords[1].keyword).toBe("A");
    expect(result.keywords[1].rank).toBe(2);
    expect(result.keywords[1].frequency).toBe(1);
  });
});