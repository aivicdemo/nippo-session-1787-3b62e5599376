import { detectAndNotifyUnsubmitted } from "../../src/logic/submission-status-management";

describe("submission-status-management", () => {
  test("SCEN-149: detectAndNotifyUnsubmitted returns ESCALATED_TO_HUMAN when data quality score is below threshold", async () => {
    const data_quality_threshold = 0.6;
    const actual_data_quality_score = 0.45;
    const missing_data_rate = 0.30;
    const validation_failure_reason = "欠損データ率が30%を超過";

    const mock_unsubmitted_members = [
      { user_id: "user_001", user_name: "田中太郎", team_id: "team_A" },
      { user_id: "user_002", user_name: "佐藤花子", team_id: "team_B" },
    ];

    const mock_issue_data = [
      {
        issue_id: "ISS_001",
        title: "プロジェクトA進捗遅延",
        category: "schedule",
        priority: "high",
        reported_at: "2024-01-15T08:30:00Z",
      },
      {
        issue_id: "ISS_002",
        title: "チームB欠勤者多数",
        category: "attendance",
        priority: "medium",
        reported_at: "2024-01-15T09:00:00Z",
      },
    ];

    const mock_low_quality_data_response = {
      unsubmitted_members: mock_unsubmitted_members,
      issues: mock_issue_data,
      data_quality_score: actual_data_quality_score,
      data_quality_details: {
        missing_data_rate: missing_data_rate,
        validation_failures: [
          {
            field: "issue_description",
            failure_count: 15,
            failure_reason: validation_failure_reason,
          },
        ],
      },
      timestamp: "2024-01-15T10:00:00Z",
    };

    const fake_ai_client = {
      callAction01: jest.fn().mockResolvedValue({
        success: true,
        data: mock_low_quality_data_response,
      }),
      callAction02: jest.fn(),
      callAction03: jest.fn(),
      callAction04: jest.fn(),
      callAction05: jest.fn(),
      callAction06: jest.fn(),
      callAction07: jest.fn(),
      callAction08: jest.fn(),
    };

    const audit_log_events: any[] = [];
    const original_log = console.log;
    console.log = jest.fn((msg: string) => {
      if (msg.includes("AUDIT_LOG") || msg.includes("escalation")) {
        audit_log_events.push(msg);
      }
    });

    const result = await detectAndNotifyUnsubmitted({
      data_quality_threshold: data_quality_threshold,
      ai_client: fake_ai_client,
    });

    console.log = original_log;

    expect(result.status).toBe("ESCALATED_TO_HUMAN");
    expect(result.escalation_reason).toBe("DATA_QUALITY_BELOW_THRESHOLD");
    expect(result.data_quality_score).toBe(actual_data_quality_score);
    expect(result.validation_error_details).toContain(validation_failure_reason);
    expect(result.required_action_type).toBe("manual_validation");

    expect(fake_ai_client.callAction02).not.toHaveBeenCalled();
    expect(fake_ai_client.callAction03).not.toHaveBeenCalled();
    expect(fake_ai_client.callAction04).not.toHaveBeenCalled();
    expect(fake_ai_client.callAction05).not.toHaveBeenCalled();

    expect(audit_log_events.length).toBeGreaterThan(0);
    const escalation_log = audit_log_events.find((log: string) =>
      log.includes("DATA_QUALITY_BELOW_THRESHOLD")
    );
    expect(escalation_log).toBeDefined();
    expect(escalation_log).toContain("manual_validation");
    expect(escalation_log).toContain("0.45");
  });
});