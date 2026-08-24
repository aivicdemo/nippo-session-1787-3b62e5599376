import { validateToolIntegrationSuccess } from "../../src/logic/tool-integration";

describe("Tool Integration Validation", () => {
  // SCEN-1415: [error] 課題データアーカイブ機能 - PM検証完了フラグが false のときエラーが返される
  test("should return ARCHIVE_VALIDATION_FAILED error when PM verification flag is false", () => {
    const input = {
      integrationId: "integration-001",
      sourceIssueCount: 5,
      targetToolType: "jira" as const,
      registeredIssueIds: ["JIRA-001", "JIRA-002", "JIRA-003", "JIRA-004", "JIRA-005"],
      sourceIssueData: [
        {
          issueId: "RPT-001",
          keyword: "database-performance",
          priorityScore: 85,
        },
        {
          issueId: "RPT-002",
          keyword: "api-timeout",
          priorityScore: 72,
        },
        {
          issueId: "RPT-003",
          keyword: "memory-leak",
          priorityScore: 90,
        },
        {
          issueId: "RPT-004",
          keyword: "cache-invalidation",
          priorityScore: 65,
        },
        {
          issueId: "RPT-005",
          keyword: "concurrency-issue",
          priorityScore: 78,
        },
      ],
      pmVerificationCompleted: false,
    };

    const result = validateToolIntegrationSuccess(input);

    expect(result.isValid).toBe(false);
    expect(result.validationStatus).toBe("mismatch");
    expect(result.recommendedAction).toBe("manual_review");
    expect(result.mismatchDetails).toBeDefined();
    expect(Array.isArray(result.mismatchDetails)).toBe(true);

    if (result.mismatchDetails && result.mismatchDetails.length > 0) {
      const pmVerificationDetail = result.mismatchDetails.find(
        (detail) => detail.mismatchType === "status"
      );
      expect(pmVerificationDetail).toBeDefined();
      expect(pmVerificationDetail?.expectedValue).toBe("true");
      expect(pmVerificationDetail?.actualValue).toBe("false");
    }
  });
});