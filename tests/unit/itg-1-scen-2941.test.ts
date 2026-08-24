import { describe, test, expect, beforeEach } from "@jest/globals";
import {
  extractAndRankIssueKeywords,
  type ExtractIssueKeywordsInput,
  type RankedIssueKeywordList,
} from "../../src/logic/issue-extraction-prioritization";

describe("Issue Keyword Extraction and Ranking", () => {
  // SCEN-2941
  test("should accurately aggregate issue keywords when start date and end date are identical", async () => {
    // Arrange
    const targetDate = new Date("2026-08-19T00:00:00Z");
    const input: ExtractIssueKeywordsInput = {
      teamId: "team-001",
      startDate: targetDate,
      endDate: new Date("2026-08-19T23:59:59Z"),
      minFrequencyThreshold: 1,
      requestUserId: "user-001",
    };

    const mockAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([
        { keyword: "ネットワーク遅延", frequency: 2 },
        { keyword: "サーバーメモリ不足", frequency: 1 },
        { keyword: "ネットワーク遅延", frequency: 1 },
      ]),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    // Act
    const result: RankedIssueKeywordList =
      await extractAndRankIssueKeywords(input, mockAnalysisAdapter);

    // Assert
    expect(result).toBeDefined();
    expect(result.keywords).toBeDefined();
    expect(Array.isArray(result.keywords)).toBe(true);

    expect(result.keywords.length).toBe(2);

    const networkDelayKeyword = result.keywords.find(
      (k) => k.keyword === "ネットワーク遅延"
    );
    const memoryKeyword = result.keywords.find(
      (k) => k.keyword === "サーバーメモリ不足"
    );

    expect(networkDelayKeyword).toBeDefined();
    expect(networkDelayKeyword!.frequency).toBe(3);
    expect(networkDelayKeyword!.rank).toBe(1);

    expect(memoryKeyword).toBeDefined();
    expect(memoryKeyword!.frequency).toBe(1);
    expect(memoryKeyword!.rank).toBe(2);

    expect(result.totalKeywordCount).toBe(3);
    expect(result.extractedAt).toBeDefined();
    expect(result.analysisperiodDays).toBe(1);

    expect(mockAnalysisAdapter.extractKeywords).toHaveBeenCalledWith(
      expect.objectContaining({
        teamId: "team-001",
        startDate: targetDate,
        endDate: expect.any(Date),
      })
    );
  });
});