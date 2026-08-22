import { describe, test, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { detectAndNotifyUnsubmitted } from "../../src/logic/submission-status-management";

describe("submission-status-management", () => {
  // SCEN-100
  test("should escalate when AI output has low confidence, ambiguous categories, and malformed format", async () => {
    const fakeAiClient = {
      extractPriorityCategoryFromIssue: jest.fn(),
      validateIssueFormat: jest.fn(),
      checkCategoryAmbiguity: jest.fn(),
    };

    const testIssueData = [
      {
        issue_id: "ISSUE-001",
        title: "Database connection timeout",
        description: "System unable to establish DB connection",
        created_at: "2024-01-15T09:00:00Z",
        reported_by: "member-001",
      },
      {
        issue_id: "ISSUE-002",
        title: "API response delay",
        description: "API endpoint responding slowly during peak hours",
        created_at: "2024-01-15T10:30:00Z",
        reported_by: "member-002",
      },
    ];

    fakeAiClient.extractPriorityCategoryFromIssue.mockResolvedValueOnce({
      priority: "HIGH",
      category: "infrastructure",
      confidence_score: 0.35,
    });

    fakeAiClient.checkCategoryAmbiguity.mockResolvedValueOnce({
      is_ambiguous: true,
      candidate_categories: ["infrastructure", "performance", "networking"],
      ambiguity_reason: "Issue could be classified as infrastructure, performance, or networking problem",
    });

    fakeAiClient.validateIssueFormat.mockResolvedValueOnce({
      is_valid: false,
      missing_fields: ["resolution_time"],
      type_mismatches: [{ field: "priority", expected: "string", received: "number" }],
      format_errors: ["priority field is number instead of string"],
    });

    const result = await detectAndNotifyUnsubmitted(
      testIssueData,
      fakeAiClient as any,
      {
        confidence_threshold: 0.5,
        enable_tool_integration: true,
        audit_log_enabled: true,
      }
    );

    expect(result.escalation_flag).toBe(true);
    expect(result.status).toBe("ESCALATED_FOR_HUMAN_REVIEW");
    expect(result.escalation_reason).toContain("LOW_CONFIDENCE_PRIORITY");
    expect(result.escalation_reason).toContain("AMBIGUOUS_CATEGORY");
    expect(result.escalation_reason).toContain("MALFORMED_OUTPUT");

    expect(result.validator_details).toBeDefined();
    expect(result.validator_details.confidence_check).toBeDefined();
    expect(result.validator_details.confidence_check.detected).toBe(true);
    expect(result.validator_details.confidence_check.score).toBe(0.35);
    expect(result.validator_details.confidence_check.threshold).toBe(0.5);

    expect(result.validator_details.ambiguity_check).toBeDefined();
    expect(result.validator_details.ambiguity_check.detected).toBe(true);
    expect(result.validator_details.ambiguity_check.candidate_count).toBe(3);

    expect(result.validator_details.format_check).toBeDefined();
    expect(result.validator_details.format_check.detected).toBe(true);
    expect(result.validator_details.format_check.missing_fields_count).toBe(1);
    expect(result.validator_details.format_check.type_mismatches_count).toBe(1);

    expect(fakeAiClient.extractPriorityCategoryFromIssue).toHaveBeenCalledWith(
      expect.objectContaining({
        issue_id: "ISSUE-001",
      })
    );

    expect(result.human_review_issues).toBeDefined();
    expect(result.human_review_issues.length).toBeGreaterThan(0);
    expect(result.human_review_issues).toContain("ISSUE-001");

    expect(result.tool_integration_skipped).toBe(true);

    expect(result.audit_log_entries).toBeDefined();
    expect(result.audit_log_entries.length).toBeGreaterThan(0);

    const auditEntry = result.audit_log_entries.find(
      (entry) => entry.issue_id === "ISSUE-001"
    );
    expect(auditEntry).toBeDefined();
    expect(auditEntry.event_type).toBe("ESCALATION_TRIGGERED");
    expect(auditEntry.escalation_reasons).toContain("LOW_CONFIDENCE_PRIORITY");
    expect(auditEntry.escalation_reasons).toContain("AMBIGUOUS_CATEGORY");
    expect(auditEntry.escalation_reasons).toContain("MALFORMED_OUTPUT");
    expect(auditEntry.timestamp).toBeDefined();
  });
});