import { describe, test, expect, beforeEach, jest } from "@jest/globals";
import { generateMonthlyAnalysisReport } from "../../src/logic/analysis-reporting";

describe("generateMonthlyAnalysisReport", () => {
  // SCEN-048
  test("should escalate to human review when priority confidence is below 0.45 threshold", async () => {
    const unifiedReportContent = [
      {
        employee_id: "EMP001",
        date: "2024-01-15",
        report_text:
          "Completed database migration. Some connection issues observed.",
        issues: [
          {
            description: "Database connection timeout",
            impact: "medium",
            frequency: "occasional",
          },
        ],
      },
      {
        employee_id: "EMP002",
        date: "2024-01-15",
        report_text: "API endpoint optimization in progress.",
        issues: [
          {
            description: "Response time degradation",
            impact: "low",
            frequency: "rare",
          },
        ],
      },
      {
        employee_id: "EMP003",
        date: "2024-01-15",
        report_text:
          "Customer reported unclear behavior in the system. Details need clarification.",
        issues: [
          {
            description: "Unclear system behavior report",
            impact: "uncertain",
            frequency: "unclear",
          },
        ],
      },
      {
        employee_id: "EMP004",
        date: "2024-01-15",
        report_text: "Deployment completed successfully.",
        issues: [],
      },
      {
        employee_id: "EMP005",
        date: "2024-01-15",
        report_text: "Testing phase started with ambiguous requirements.",
        issues: [
          {
            description: "Ambiguous test requirements",
            impact: "medium",
            frequency: "persistent",
          },
        ],
      },
      {
        employee_id: "EMP006",
        date: "2024-01-15",
        report_text: "Code review in progress.",
        issues: [],
      },
      {
        employee_id: "EMP007",
        date: "2024-01-15",
        report_text: "Documentation update completed.",
        issues: [],
      },
      {
        employee_id: "EMP008",
        date: "2024-01-15",
        report_text:
          "Possibly problematic but unclear behavior noticed in staging.",
        issues: [
          {
            description: "Unclear staging environment behavior",
            impact: "unknown",
            frequency: "undetermined",
          },
        ],
      },
      {
        employee_id: "EMP009",
        date: "2024-01-15",
        report_text: "Meeting with stakeholders completed.",
        issues: [],
      },
      {
        employee_id: "EMP010",
        date: "2024-01-15",
        report_text: "Regular maintenance tasks finished.",
        issues: [],
      },
    ];

    const uncertaintyIssuesWithLowConfidence = [
      {
        issue_id: "ISSUE_003_001",
        employee_id: "EMP003",
        extracted_text: "Customer reported unclear behavior in the system.",
        priority_confidence_score: 0.42,
        suggested_priority: "MEDIUM",
        category: "system_behavior",
      },
      {
        issue_id: "ISSUE_008_001",
        employee_id: "EMP008",
        extracted_text:
          "Possibly problematic but unclear behavior noticed in staging.",
        priority_confidence_score: 0.38,
        suggested_priority: "LOW",
        category: "staging_issue",
      },
    ];

    const handoverData = {
      unified_reports: unifiedReportContent,
      uncertain_priority_issues: uncertaintyIssuesWithLowConfidence,
      escalation_reason: "priority_uncertainty",
      timestamp: "2024-01-15T09:30:00Z",
      actor: "ai_agent_tx2_imp1",
      target_actor: "department_manager",
      status: "awaiting_human_decision",
    };

    const auditLog = {
      event_id: `audit_${Date.now()}`,
      escalation_reason: "priority_uncertainty",
      timestamp: "2024-01-15T09:30:00Z",
      actor: "ai_agent_tx2_imp1",
      target_actor: "department_manager",
      status: "awaiting_human_decision",
      issue_count: 2,
      confidence_scores: [0.42, 0.38],
    };

    const result = await generateMonthlyAnalysisReport({
      unified_reports: unifiedReportContent,
      uncertain_priority_issues: uncertaintyIssuesWithLowConfidence,
      escalation_trigger: true,
      confidence_threshold: 0.45,
      audit_logger: jest.fn().mockResolvedValue({ logged: true }),
      email_service_stub: {
        sendConfirmationEmail: jest.fn(),
        recordAttempt: jest.fn(),
      },
    });

    expect(result.escalation_triggered).toBe(true);
    expect(result.escalation_reason).toBe("priority_uncertainty");
    expect(result.handover_data).toEqual(
      expect.objectContaining({
        escalation_reason: "priority_uncertainty",
        status: "awaiting_human_decision",
        actor: "ai_agent_tx2_imp1",
        target_actor: "department_manager",
      })
    );

    expect(result.email_sent).toBe(false);
    expect(result.email_service_stub.sendConfirmationEmail).not.toHaveBeenCalled();

    expect(result.audit_log_recorded).toBe(true);
    expect(result.audit_logger).toHaveBeenCalledWith(
      expect.objectContaining({
        escalation_reason: "priority_uncertainty",
        actor: "ai_agent_tx2_imp1",
        target_actor: "department_manager",
        status: "awaiting_human_decision",
      })
    );

    expect(result.uncertain_issues_count).toBe(2);
    expect(result.uncertain_issues_list).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          issue_id: "ISSUE_003_001",
          priority_confidence_score: 0.42,
        }),
        expect.objectContaining({
          issue_id: "ISSUE_008_001",
          priority_confidence_score: 0.38,
        }),
      ])
    );

    expect(result.sideeffects_committed).toBe(false);
    expect(result.human_review_awaiting).toBe(true);
  });
});