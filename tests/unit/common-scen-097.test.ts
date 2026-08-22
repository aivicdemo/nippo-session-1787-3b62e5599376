import { generateWeeklyAnalysisReport } from "../../src/logic/analysis-reporting";
import type { Tx5Imp1AiClient } from "../../src/agents/tx-5-imp-1/types";

describe("generateWeeklyAnalysisReport with escalation for multiple categories", () => {
  // SCEN-097
  test("should escalate to human review when extracted issue matches multiple categories before tool integration", async () => {
    const extracted_issue_id = "ISSUE-20240115-001";
    const extracted_issue_text =
      "Database performance degradation affecting both payment processing and user authentication";
    const extracted_categories_detected = ["performance", "database", "security"];

    const mock_ai_client: Tx5Imp1AiClient = {
      action01_validate_format: jest.fn(async () => ({
        is_valid: true,
        validation_errors: [],
      })),

      action02_auto_judge_priority_category: jest.fn(async () => ({
        priority_score: 8,
        category_matches: [
          {
            category_name: "database_performance",
            confidence: 0.92,
          },
          {
            category_name: "security_access_control",
            confidence: 0.88,
          },
          {
            category_name: "payment_system_critical",
            confidence: 0.85,
          },
        ],
        judgment_reasoning:
          "Issue text contains keywords matching three distinct business categories",
        multiple_categories_detected: true,
      })),

      action03_configure_tool_integration: jest.fn(async () => ({
        success: false,
        error_message:
          "This action should not be called due to escalation at Action 2",
      })),

      action04_register_to_jira: jest.fn(async () => ({
        success: false,
        error_message:
          "This action should not be called due to escalation at Action 2",
      })),

      action05_register_to_asana: jest.fn(async () => ({
        success: false,
        error_message:
          "This action should not be called due to escalation at Action 2",
      })),

      action06_record_integration_status: jest.fn(async () => ({
        success: false,
        error_message:
          "This action should not be called due to escalation at Action 2",
      })),
    };

    const escalation_timestamp_start = new Date("2024-01-15T08:00:00Z");
    const escalation_timestamp_end = new Date("2024-01-15T08:01:00Z");

    const result = await generateWeeklyAnalysisReport(
      {
        issue_id: extracted_issue_id,
        issue_text: extracted_issue_text,
        source_date: "2024-01-15",
        reporter_id: "EMP-12345",
      },
      mock_ai_client
    );

    expect(result.escalation_reason).toBe("multiple_categories");
    expect(result.human_review_required).toBe(true);
    expect(result.escalation_timestamp).toBeDefined();

    const escalation_ts = new Date(result.escalation_timestamp);
    expect(escalation_ts.getTime()).toBeGreaterThanOrEqual(
      escalation_timestamp_start.getTime()
    );
    expect(escalation_ts.getTime()).toBeLessThanOrEqual(
      escalation_timestamp_end.getTime()
    );

    expect(result.human_notification).toBeDefined();
    expect(result.human_notification.issue_id).toBe(extracted_issue_id);
    expect(result.human_notification.matched_categories).toEqual([
      "database_performance",
      "security_access_control",
      "payment_system_critical",
    ]);
    expect(result.human_notification.judgment_reasoning).toContain(
      "three distinct business categories"
    );

    expect(mock_ai_client.action01_validate_format).toHaveBeenCalled();
    expect(mock_ai_client.action02_auto_judge_priority_category).toHaveBeenCalled();
    expect(
      mock_ai_client.action03_configure_tool_integration
    ).not.toHaveBeenCalled();
    expect(mock_ai_client.action04_register_to_jira).not.toHaveBeenCalled();
    expect(mock_ai_client.action05_register_to_asana).not.toHaveBeenCalled();
    expect(
      mock_ai_client.action06_record_integration_status
    ).not.toHaveBeenCalled();

    expect(result.audit_log_entry).toBeDefined();
    expect(result.audit_log_entry.event_type).toBe("escalation");
    expect(result.audit_log_entry.escalation_reason).toBe("multiple_categories");
    expect(result.audit_log_entry.actor).toBe("ai_agent_tx5_imp1");
    expect(result.audit_log_entry.timestamp).toBeDefined();

    const audit_ts = new Date(result.audit_log_entry.timestamp);
    expect(audit_ts.getTime()).toBeGreaterThanOrEqual(
      escalation_timestamp_start.getTime()
    );
    expect(audit_ts.getTime()).toBeLessThanOrEqual(
      escalation_timestamp_end.getTime()
    );
  });
});