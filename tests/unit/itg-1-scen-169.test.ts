import { updateIssueDataWithAnalysisResult } from "../../src/logic/issue-data-persistence";

describe("Issue Data Persistence", () => {
  // SCEN-169
  test("should throw AnalysisResultValidationError when priorityScore is out of range (0-100)", () => {
    const input = {
      issueId: "issue-001",
      priorityScore: -1,
      impactLevel: "high",
      analysisResult: {
        rootCause: "Root cause analysis",
        proposedCountermeasure: "Proposed action",
        estimatedResolutionDays: 5,
      },
      updatedByUserId: "user-pm-001",
    };

    expect(() => updateIssueDataWithAnalysisResult(input)).toThrow(
      /優先度スコア: -1/
    );
  });
});