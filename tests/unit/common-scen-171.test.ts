import { extractAndRankIssues } from "../../src/logic/issue-extraction-prioritization";
import type {
  ExtractAndRankIssuesInput,
  ExtractAndRankIssuesOutput,
  ValidationError,
  EscalationData,
} from "../../src/logic/issue-extraction-prioritization";

describe("issue-extraction-prioritization", () => {
  // SCEN-171
  test("should reject malformed, ambiguous, and low-confidence AI outputs and escalate to human review with structured handoff data", () => {
    // Prepare test data with raw daily reports
    const test_aggregated_reports = [
      {
        report_id: "report_001",
        member_id: "member_a",
        date: "2024-01-15",
        content: "Development blocked by external API issue",
        submitted_at: "2024-01-15T08:30:00Z",
      },
      {
        report_id: "report_002",
        member_id: "member_b",
        date: "2024-01-15",
        content: "Database performance degradation observed",
        submitted_at: "2024-01-15T08:45:00Z",
      },
    ];

    const test_period_start = "2024-01-15";
    const test_period_end = "2024-01-15";

    // Mock AI output with malformed schema (missing required fields)
    const test_malformed_ai_output = {
      extracted_issues: [
        {
          issue_id: "issue_001",
          // Missing required field: description
          category: "technical",
          // Missing required field: priority
        },
      ],
      confidence_score: 0.45, // Below 0.5 threshold
      // Missing required field: recommendations
    };

    // Mock AI output with ambiguous priority values
    const test_ambiguous_ai_output = {
      extracted_issues: [
        {
          issue_id: "issue_002",
          description: "API integration failure",
          category: "technical",
          priority: "high-medium", // Invalid: should be "high", "medium", or "low"
          confidence: 0.6,
        },
      ],
      confidence_score: 0.75,
      recommendations: ["Investigate API issue"],
    };

    // Mock AI output with low confidence score
    const test_low_confidence_ai_output = {
      extracted_issues: [
        {
          issue_id: "issue_003",
          description: "Performance issue",
          category: "performance",
          priority: "medium",
          confidence: 0.3,
        },
      ],
      confidence_score: 0.35, // Below 0.5 threshold
      recommendations: ["Monitor system"],
    };

    // Mock AI output with contradictory recommendations
    const test_contradictory_ai_output = {
      extracted_issues: [
        {
          issue_id: "issue_004",
          description: "Critical system outage",
          category: "critical",
          priority: "high",
          confidence: 0.8,
        },
      ],
      confidence_score: 0.85,
      recommendations: [
        "Escalate immediately to senior engineers",
        "Monitor for 24 hours before taking action",
        "Ignore this issue and proceed normally",
      ],
    };

    // Test Case 1: Malformed schema rejection
    const test_input_malformed: ExtractAndRankIssuesInput = {
      aggregated_reports: test_aggregated_reports,
      period_start: test_period_start,
      period_end: test_period_end,
      ai_output: test_malformed_ai_output,
    };

    const test_result_malformed = extractAndRankIssues(test_input_malformed);
    expect(test_result_malformed.status).toBe("ESCALATION_TO_HUMAN_REVIEW");
    expect(test_result_malformed.workflow_continue).toBe(false);
    expect(test_result_malformed.escalation_data).toBeDefined();
    expect(test_result_malformed.escalation_data?.rejection_reason).toMatch(
      /スキーマ不合致/
    );
    expect(test_result_malformed.escalation_data?.failed_ai_output).toEqual(
      test_malformed_ai_output
    );
    expect(test_result_malformed.escalation_data?.raw_reports).toEqual(
      test_aggregated_reports
    );
    expect(test_result_malformed.escalation_data?.human_review_required).toBe(
      true
    );
    expect(test_result_malformed.escalation_data?.retry_recommended).toBe(true);
    expect(test_result_malformed.escalation_data?.timestamp).toBeDefined();

    // Test Case 2: Ambiguous priority rejection
    const test_input_ambiguous: ExtractAndRankIssuesInput = {
      aggregated_reports: test_aggregated_reports,
      period_start: test_period_start,
      period_end: test_period_end,
      ai_output: test_ambiguous_ai_output,
    };

    const test_result_ambiguous = extractAndRankIssues(test_input_ambiguous);
    expect(test_result_ambiguous.status).toBe("ESCALATION_TO_HUMAN_REVIEW");
    expect(test_result_ambiguous.workflow_continue).toBe(false);
    expect(test_result_ambiguous.escalation_data).toBeDefined();
    expect(test_result_ambiguous.escalation_data?.rejection_reason).toMatch(
      /曖昧な優先度/
    );
    expect(test_result_ambiguous.escalation_data?.human_review_required).toBe(
      true
    );

    // Test Case 3: Low confidence score rejection
    const test_input_low_confidence: ExtractAndRankIssuesInput = {
      aggregated_reports: test_aggregated_reports,
      period_start: test_period_start,
      period_end: test_period_end,
      ai_output: test_low_confidence_ai_output,
    };

    const test_result_low_confidence = extractAndRankIssues(
      test_input_low_confidence
    );
    expect(test_result_low_confidence.status).toBe(
      "ESCALATION_TO_HUMAN_REVIEW"
    );
    expect(test_result_low_confidence.workflow_continue).toBe(false);
    expect(test_result_low_confidence.escalation_data).toBeDefined();
    expect(test_result_low_confidence.escalation_data?.rejection_reason).toMatch(
      /確信度0\.5以下/
    );
    expect(test_result_low_confidence.escalation_data?.failed_ai_output).toEqual(
      test_low_confidence_ai_output
    );

    // Test Case 4: Contradictory recommendations rejection
    const test_input_contradictory: ExtractAndRankIssuesInput = {
      aggregated_reports: test_aggregated_reports,
      period_start: test_period_start,
      period_end: test_period_end,
      ai_output: test_contradictory_ai_output,
    };

    const test_result_contradictory = extractAndRankIssues(
      test_input_contradictory
    );
    expect(test_result_contradictory.status).toBe(
      "ESCALATION_TO_HUMAN_REVIEW"
    );
    expect(test_result_contradictory.workflow_continue).toBe(false);
    expect(test_result_contradictory.escalation_data).toBeDefined();
    expect(
      test_result_contradictory.escalation_data?.rejection_reason
    ).toMatch(/矛盾する推奨施策/);

    // Verify handoff data structure for all cases
    const test_all_results = [
      test_result_malformed,
      test_result_ambiguous,
      test_result_low_confidence,
      test_result_contradictory,
    ];

    test_all_results.forEach((test_result) => {
      const test_escalation = test_result.escalation_data;
      expect(test_escalation).toBeDefined();
      expect(test_escalation?.rejection_reason).toBeTruthy();
      expect(test_escalation?.failed_ai_output).toBeDefined();
      expect(test_escalation?.raw_reports).toEqual(test_aggregated_reports);
      expect(test_escalation?.human_review_required).toBe(true);
      expect(typeof test_escalation?.retry_recommended).toBe("boolean");
      expect(test_escalation?.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
      );
      expect(test_escalation?.period_start).toBe(test_period_start);
      expect(test_escalation?.period_end).toBe(test_period_end);
    });
  });
});