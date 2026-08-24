import { describe, test, expect, beforeEach } from "@jest/globals";
import { extractAndRankIssueKeywords } from "../../src/logic/issue-extraction-prioritization";
import { type ExtractIssueKeywordsInput } from "../../src/logic/issue-extraction-prioritization";

describe("Issue Extraction and Ranking", () => {
  // SCEN-1324
  test("should throw error when extracted keywords array is empty", async () => {
    const mockTextAnalysisService = {
      extractKeywords: jest.fn().mockResolvedValue([]),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: "team-001",
      startDate: new Date("2024-01-08T00:00:00Z"),
      endDate: new Date("2024-01-14T23:59:59Z"),
      minFrequencyThreshold: 1,
      requestUserId: "user-001",
    };

    await expect(
      extractAndRankIssueKeywords(input, mockTextAnalysisService)
    ).rejects.toThrow(/抽出済みキーワード|課題キーワード配列が空/);

    expect(mockTextAnalysisService.extractKeywords).toHaveBeenCalled();
    expect(mockTextAnalysisService.assessImpactScore).not.toHaveBeenCalled();
    expect(mockTextAnalysisService.classifyIssueSeverity).not.toHaveBeenCalled();
  });
});