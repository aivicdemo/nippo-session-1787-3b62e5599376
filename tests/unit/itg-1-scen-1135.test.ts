import { describe, test, expect, beforeEach } from "@jest/globals";
import { extractAndRankIssueKeywords } from "../../src/logic/issue-extraction-prioritization";

describe("Issue Extraction and Ranking - Empty Data Validation", () => {
  // SCEN-1135: [error] 抽出課題データ有効性検証機能 - 抽出課題データが空配列のとき検証結果として空を返す
  test("should return empty result when extracted keywords are empty", () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([]),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input = {
      teamId: "team-001",
      startDate: new Date("2024-01-01T00:00:00Z"),
      endDate: new Date("2024-01-07T23:59:59Z"),
      minFrequencyThreshold: 1,
      requestUserId: "user-manager-001",
    };

    const result = extractAndRankIssueKeywords(input, mockTextAnalysisAdapter);

    expect(result).toEqual({
      keywords: [],
      totalKeywordCount: 0,
      extractedAt: expect.any(Date),
      analysisperiodDays: 7,
    });
  });
});