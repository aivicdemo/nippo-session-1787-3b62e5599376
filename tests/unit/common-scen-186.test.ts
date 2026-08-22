import { detectAndNotifyUnsubmitted } from "../../src/logic/submission-status-management";

describe("submission-status-management", () => {
  test("SCEN-186: tx_10_imp_1 escalation when feedback outlier members detected - halts auto-distribution before side effects and escalates to human review", async () => {
    // Setup: Initial state - orchestrator preparing to start tx_10_imp_1 (导入计画・研修実施・フィードバック対応)
    // Actions 1-4 completed successfully, initial feedback target members collected

    // Action 5 input: Initial feedback target members with samples significantly deviating from baseline
    // Baseline: submission_rate >= 50%, report_quality_score >= 30
    // Outlier sample: submission_rate = 20%, report_quality_score = 15
    const feedback_target_members = [
      {
        member_id: "MBR001",
        member_name: "田中太郎",
        submission_rate: 0.95, // 95% - normal
        report_quality_score: 85, // normal
      },
      {
        member_id: "MBR002",
        member_name: "鈴木花子",
        submission_rate: 0.2, // 20% - outlier, significantly below 50% baseline
        report_quality_score: 15, // outlier, significantly below 30 baseline
        deviation_reason: "system_login_issues",
      },
      {
        member_id: "MBR003",
        member_name: "佐藤次郎",
        submission_rate: 0.85, // 85% - normal
        report_quality_score: 72, // normal
      },
    ];

    const orchestrator_input = {
      action_sequence: [1, 2, 3, 4, 5],
      current_action: 5,
      initial_feedback_members: feedback_target_members,
      quality_baseline_submission_rate: 0.5,
      quality_baseline_report_score: 30,
      escalation_threshold_deviation_factor: 0.4, // members deviating >40% below baseline trigger escalation
      department_head_id: "DEPT_HEAD_001",
      processing_timestamp: "2024-02-20T09:30:00Z",
    };

    // Fake AI client simulating Action 5 analysis result
    const fake_ai_response = {
      action: 5,
      status: "ANALYSIS_COMPLETE",
      analyzed_members: feedback_target_members,
      outlier_detection: {
        outlier_members: [
          {
            member_id: "MBR002",
            member_name: "鈴木花子",
            deviation_metrics: {
              submission_rate_deviation: -0.75, // (0.2 - 0.5) / 0.5 = -60% deviation
              report_quality_deviation: -0.5, // (15 - 30) / 30 = -50% deviation
            },
            risk_assessment: "HIGH",
            likely_causes: ["system_access_issues", "training_gap"],
          },
        ],
        outlier_count: 1,
        total_analyzed: 3,
      },
      escalation_flag: true,
      escalation_reason_code: "FEEDBACK_OUTLIER",
      affected_members: [
        {
          member_id: "MBR002",
          member_name: "鈴木花子",
          escalation_detail: "Submission rate 20% (baseline 50%), quality score 15 (baseline 30)",
          recommended_actions: [
            "schedule_1on1_with_department_head",
            "provide_targeted_training",
            "assess_technical_barriers",
          ],
        },
      ],
    };

    // Orchestrator execution with escalation condition triggered
    // This should detect outlier at Action 5 and escalate before executing Action 6 (auto-distribution)
    const orchestrator_result = await detectAndNotifyUnsubmitted(
      orchestrator_input,
      fake_ai_response
    );

    // Assertion 1: Orchestrator returns escalated status (Action 6 not executed)
    expect(orchestrator_result.status).toBe("ESCALATED");

    // Assertion 2: Escalation reason is correctly set
    expect(orchestrator_result.escalation_reason).toBe("FEEDBACK_OUTLIER");

    // Assertion 3: Pending human action indicates department head review required
    expect(orchestrator_result.pending_human_action).toBeDefined();
    expect(orchestrator_result.pending_human_action.department_head_review_required).toBe(
      true
    );

    // Assertion 4: Outlier members list includes detected member
    expect(orchestrator_result.pending_human_action.outlier_members).toHaveLength(1);
    expect(orchestrator_result.pending_human_action.outlier_members[0].member_id).toBe(
      "MBR002"
    );
    expect(orchestrator_result.pending_human_action.outlier_members[0].member_name).toBe(
      "鈴木花子"
    );

    // Assertion 5: Escalation timestamp is set in ISO8601 format
    expect(orchestrator_result.pending_human_action.escalation_timestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    );

    // Assertion 6: Escalation state recorded as PENDING_HUMAN_REVIEW (not auto-distributed)
    expect(orchestrator_result.escalation_state).toBe("PENDING_HUMAN_REVIEW");

    // Assertion 7: Escalation reason code stored in structured data
    expect(orchestrator_result.escalation_metadata.reason_code).toBe("FEEDBACK_OUTLIER");

    // Assertion 8: Detailed outlier information provided for human review
    expect(orchestrator_result.escalation_metadata.outlier_details).toBeDefined();
    expect(
      orchestrator_result.escalation_metadata.outlier_details.member_submission_rate_deviation
    ).toBe(-0.6);
    expect(
      orchestrator_result.escalation_metadata.outlier_details.member_quality_score_deviation
    ).toBe(-0.5);

    // Assertion 9: Auto-distribution flag is false (Action 6 skipped)
    expect(orchestrator_result.auto_distribution_executed).toBe(false);

    // Assertion 10: Audit log entry created for escalation
    expect(orchestrator_result.audit_log).toBeDefined();
    expect(orchestrator_result.audit_log.action).toBe("ESCALATION_TRIGGERED");
    expect(orchestrator_result.audit_log.escalation_trigger).toBe("FEEDBACK_OUTLIER");
    expect(orchestrator_result.audit_log.timestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    );

    // Assertion 11: No feedback auto-distribution record created
    expect(orchestrator_result.feedback_distribution_status).toBe("NOT_EXECUTED");

    // Assertion 12: Control flow branched to human review path, not auto-execution
    expect(orchestrator_result.next_action).toBe("AWAIT_DEPARTMENT_HEAD_REVIEW");

    // Assertion 13: Recommended actions for human review provided
    expect(orchestrator_result.escalation_metadata.recommended_actions).toContain(
      "schedule_1on1_with_department_head"
    );
    expect(orchestrator_result.escalation_metadata.recommended_actions).toContain(
      "provide_targeted_training"
    );
  });
});