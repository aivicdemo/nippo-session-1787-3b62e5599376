import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { runTx3Imp1Agent } from "../../src/agents/tx-3-imp-1/orchestrator";

// Mock fetch
const fetchMock = require("jest-fetch-mock");
fetchMock.enableMocks();

describe("tx-3-imp-1 orchestrator - runTx3Imp1Agent", () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-064
  test("should escalate and defer priority determination when multi-department issues are detected, then resume after human approval", async () => {
    // 1. Initialize fake AI client and mock aggregated daily report data with multi-department issue
    const fakeAiClient = {
      callAction01ExtractIssueKeywords: jest.fn(async (prompt) => ({
        keywords: [
          "営業部",
          "製造部",
          "納期遅延",
          "顧客対応",
          "品質",
        ],
        extractedAt: new Date("2024-01-15T09:00:00Z"),
        confidence: 0.92,
      })),
      callAction02ClassifyCategory: jest.fn(async (prompt) => ({
        classification: {
          category: "multi_department",
          affected_departments: ["営業部", "製造部"],
          is_multi_department: true,
          primary_category: "納期対応",
        },
        classifiedAt: new Date("2024-01-15T09:05:00Z"),
        confidence: 0.88,
      })),
      callAction03DeterminePriority: jest.fn(async (prompt) => ({
        priority_score: 85,
        priority_level: "high",
        determined_at: new Date("2024-01-15T09:10:00Z"),
      })),
      callAction04GenerateIssueListing: jest.fn(async (prompt) => ({
        issue_list: [
          {
            id: "ISSUE-001",
            title: "納期遅延対応",
            priority_level: "high",
            affected_departments: ["営業部", "製造部"],
          },
        ],
        generated_at: new Date("2024-01-15T09:15:00Z"),
      })),
      callAction05SendEmail: jest.fn(async (prompt) => ({
        email_sent: false,
        reason: "escalation_pending",
        sent_at: null,
      })),
    };

    const aggregatedReportId = "report-2024-01-15-001";
    const analysisExecutionTime = new Date("2024-01-15T09:00:00Z");
    const managerEmail = "manager@company.com";

    const input = {
      reportAggregationId: aggregatedReportId,
      analysisExecutionTime: analysisExecutionTime,
      managerEmail: managerEmail,
      priorityThresholds: {
        highPriorityMinScore: 80,
        mediumPriorityMinScore: 50,
      },
    };

    // 2. Execute Action 1 (keyword extraction)
    const result = await runTx3Imp1Agent(input, fakeAiClient);

    // 3. Verify Action 1 output contains multi-department keywords
    expect(fakeAiClient.callAction01ExtractIssueKeywords).toHaveBeenCalledTimes(
      1
    );
    const action01Call = fakeAiClient.callAction01ExtractIssueKeywords.mock
      .calls[0][0];
    expect(action01Call).toContain("reportAggregationId");

    // 4. Verify Action 2 executed and classified as multi-department
    expect(fakeAiClient.callAction02ClassifyCategory).toHaveBeenCalledTimes(1);
    const classification = fakeAiClient.callAction02ClassifyCategory.mock
      .results[0].value;
    expect(classification.classification.is_multi_department).toBe(true);
    expect(classification.classification.affected_departments).toEqual([
      "営業部",
      "製造部",
    ]);

    // 5. Verify escalation condition is triggered before Action 3
    expect(result.status).toBe("escalation_pending");
    expect(result.escalation_reason).toBe("multi_department_issue_detected");

    // 6. Verify Action 3 was NOT executed (priority determination deferred)
    expect(fakeAiClient.callAction03DeterminePriority).not.toHaveBeenCalled();

    // 7. Verify Action 5 (email send) was NOT executed
    expect(fakeAiClient.callAction05SendEmail).not.toHaveBeenCalled();

    // 8. Verify handoff notification data is generated
    expect(result.handoff_data).toBeDefined();
    expect(result.handoff_data.target_email).toBe(managerEmail);
    expect(result.handoff_data.affected_departments).toEqual([
      "営業部",
      "製造部",
    ]);

    // 9. Verify audit log records escalation
    expect(result.audit_log).toBeDefined();
    expect(result.audit_log.events).toContainEqual(
      expect.objectContaining({
        event_type: "escalation_triggered",
        reason: "multi_department_issue",
        timestamp: expect.any(Date),
      })
    );

    expect(result.audit_log.events).toContainEqual(
      expect.objectContaining({
        event_type: "auto_determination_skipped",
        reason: "awaiting_human_review",
        timestamp: expect.any(Date),
      })
    );

    // 10. Simulate human approval and verify resume of Actions 3-5
    const resumeAiClient = {
      callAction03DeterminePriority: jest.fn(async (prompt) => ({
        priority_score: 85,
        priority_level: "high",
        determined_at: new Date("2024-01-15T09:20:00Z"),
        human_approved: true,
      })),
      callAction04GenerateIssueListing: jest.fn(async (prompt) => ({
        issue_list: [
          {
            id: "ISSUE-001",
            title: "納期遅延対応",
            priority_level: "high",
            affected_departments: ["営業部", "製造部"],
          },
        ],
        generated_at: new Date("2024-01-15T09:25:00Z"),
      })),
      callAction05SendEmail: jest.fn(async (prompt) => ({
        email_sent: true,
        email_id: "EMAIL-001",
        sent_to: managerEmail,
        sent_at: new Date("2024-01-15T09:30:00Z"),
      })),
    };

    const resumeInput = {
      reportAggregationId: aggregatedReportId,
      analysisExecutionTime: new Date("2024-01-15T09:20:00Z"),
      managerEmail: managerEmail,
      priorityThresholds: {
        highPriorityMinScore: 80,
        mediumPriorityMinScore: 50,
      },
      human_approval_token: "APPROVAL-TOKEN-001",
    };

    const resumeResult = await runTx3Imp1Agent(
      resumeInput,
      resumeAiClient as any
    );

    // Verify Actions 3-5 were executed after approval
    expect(resumeAiClient.callAction03DeterminePriority).toHaveBeenCalledTimes(
      1
    );
    expect(resumeAiClient.callAction04GenerateIssueListing).toHaveBeenCalledTimes(
      1
    );
    expect(resumeAiClient.callAction05SendEmail).toHaveBeenCalledTimes(1);

    // Verify final status is completed
    expect(resumeResult.status).toBe("completed");
    expect(resumeResult.emailSendStatus).toEqual({
      email_sent: true,
      email_id: "EMAIL-001",
      sent_to: managerEmail,
    });

    // Verify audit log records completion
    expect(resumeResult.audit_log.events).toContainEqual(
      expect.objectContaining({
        event_type: "human_approval_received",
        approval_token: "APPROVAL-TOKEN-001",
        timestamp: expect.any(Date),
      })
    );

    expect(resumeResult.audit_log.events).toContainEqual(
      expect.objectContaining({
        event_type: "auto_determination_resumed",
        timestamp: expect.any(Date),
      })
    );

    expect(resumeResult.audit_log.events).toContainEqual(
      expect.objectContaining({
        event_type: "email_sent",
        email_id: "EMAIL-001",
        timestamp: expect.any(Date),
      })
    );
  });
});