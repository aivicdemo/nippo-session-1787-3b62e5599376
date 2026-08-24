import { describe, test, expect } from "@jest/globals";
import { extractAndRankIssueKeywords } from "../../src/logic/issue-extraction-prioritization";

describe("extractAndRankIssueKeywords", () => {
  // SCEN-835
  test("should throw InvalidArgumentError with 400 status when reportingDocumentId is null", async () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const invalidInput = {
      reportingDocumentId: null,
      teamId: "team-001",
      startDate: new Date("2024-01-01T00:00:00Z"),
      endDate: new Date("2024-01-07T23:59:59Z"),
      minFrequencyThreshold: 1,
      requestUserId: "user-001",
    };

    const errorThrown = await expect(
      extractAndRankIssueKeywords(invalidInput, mockTextAnalysisServiceAdapter)
    ).rejects.toThrow(/日報IDは必須です/);

    expect(errorThrown).toBeDefined();
    expect(mockTextAnalysisServiceAdapter.extractKeywords).not.toHaveBeenCalled();
  });
});