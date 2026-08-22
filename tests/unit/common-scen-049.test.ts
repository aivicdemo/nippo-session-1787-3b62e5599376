import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { sendUnsubmittedReminder } from "../../src/logic/notification-delivery";

const fetchMock = require("jest-fetch-mock");

describe("notification-delivery", () => {
  beforeEach(() => {
    fetchMock.enableMocks();
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.disableMocks();
  });

  // SCEN-049: [error] 日報収集から課題抽出・配信までの自律実行 AIエージェント
  // - 複数課題の関連性判定が必要な場合にエスカレーション条件がトリガーされ、
  //   副作用確定前に人手引き継ぎが実行される
  test("should escalate when multiple issue correlation requires manual judgment and hold delivery before confirmation", async () => {
    const scheduleId = "schedule-2024-01-15";
    const departmentId = "dept-engineering";
    const reportDateStr = "2024-01-15T09:00:00Z";

    // AIクライアント応答: Action 3 課題抽出時に関連性判定が必要なシグナルを返す
    const action3ExtractResponse = {
      extracted_issues: [
        {
          issue_id: "issue-001",
          member_id: "member-a",
          title: "顧客システム障害対応中",
          description: "Customer system outage response in progress",
          severity: "high",
          category: "incident",
        },
        {
          issue_id: "issue-002",
          member_id: "member-b",
          title: "同一顧客システムの改善要望対応中",
          description: "Improvement request for same customer system in progress",
          severity: "high",
          category: "feature_request",
        },
      ],
      correlation_analysis: {
        requires_manual_review: true,
        correlation_hypothesis:
          "These issues may be related to the same incident within the customer system",
        confidence_score: 0.72,
        related_issue_pairs: [
          {
            issue_pair: ["issue-001", "issue-002"],
            correlation_reason: "Same customer system mentioned in both issues",
          },
        ],
      },
    };

    // エスカレーション通知応答: Action 6 配信前に人手引き継ぎ通知が発行される
    const escalationNotificationResponse = {
      notification_id: "notif-escalation-001",
      recipient: "director@example.com",
      timestamp: "2024-01-15T09:15:00Z",
      notification_type: "escalation_manual_review",
      subject: "[手動確認必要] 複数課題の関連性判定が必要です",
      body: `複数の日報から抽出された課題が同一インシデントに関連している可能性があります。\n\nメンバーA課題: 顧客システム障害対応中\nメンバーB課題: 同一顧客システムの改善要望対応中\n\n判定理由: これらの課題が同一インシデントに関連している可能性があります\n\n保留中のアクション: 優先度判定・メール配信\n現在状態: エスカレーション待機中`,
      escalation_reason: "multiple_issue_correlation_requires_judgment",
      held_action_state: {
        action_4_prioritization: "pending",
        action_6_delivery: "not_executed",
      },
      escalation_payload: {
        extracted_issues_snapshot: action3ExtractResponse.extracted_issues,
        correlation_analysis_snapshot:
          action3ExtractResponse.correlation_analysis,
        agent_internal_state: "escalation_awaiting_manual_judgment",
        delivery_status: "undelivered",
      },
    };

    // APIレスポンスをモック: Action 3 (課題抽出)
    fetchMock.mockResponseOnce(
      JSON.stringify({
        action: "extract_issues",
        result: action3ExtractResponse,
      }),
      { status: 200 }
    );

    // APIレスポンスをモック: エスカレーション通知配信
    fetchMock.mockResponseOnce(JSON.stringify(escalationNotificationResponse), {
      status: 200,
    });

    const result = await sendUnsubmittedReminder({
      scheduleId,
      departmentId,
      reportDateStr,
    });

    // 期待結果 (1): エージェント内部状態が『エスカレーション待機中』に遷移
    expect(result.agent_state).toBe("escalation_awaiting_manual_judgment");

    // 期待結果 (2): エスカレーション通知が送信され、以下の内容を含む
    expect(result.escalation_notification).toBeDefined();
    expect(result.escalation_notification.subject).toMatch(
      /手動確認必要.*複数課題.*関連性判定/
    );
    expect(result.escalation_notification.body).toContain("メンバーA課題");
    expect(result.escalation_notification.body).toContain("顧客システム障害対応中");
    expect(result.escalation_notification.body).toContain("メンバーB課題");
    expect(result.escalation_notification.body).toContain(
      "同一顧客システムの改善要望対応中"
    );
    expect(result.escalation_notification.body).toContain(
      "同一インシデントに関連している可能性"
    );

    // 期待結果 (3): 自動配信メール（Action 6）は発行されず、配信状態は『未配信』
    expect(result.delivery_status).toBe("undelivered");
    expect(result.automatic_delivery_executed).toBe(false);
    expect(result.held_actions.action_6_delivery).toBe("not_executed");

    // 期待結果 (4a): エージェント内部状態スナップショットが保存される
    expect(result.internal_state_snapshot).toBeDefined();
    expect(result.internal_state_snapshot.extracted_issues).toEqual(
      action3ExtractResponse.extracted_issues
    );
    expect(
      result.internal_state_snapshot.correlation_analysis.requires_manual_review
    ).toBe(true);
    expect(
      result.internal_state_snapshot.correlation_analysis.confidence_score
    ).toBe(0.72);

    // 期待結果 (4b): 部長による手動判定入力を受け取ると、再開/キャンセル処理が可能な状態
    expect(result.awaiting_manual_judgment_on).toContain("issue_correlation");
    expect(result.resumable_after_manual_decision).toBe(true);

    // 期待結果 (5): エスカレーション条件トリガーの検証
    expect(result.escalation_triggered_by).toBe(
      "multiple_issue_correlation_requires_judgment"
    );
    expect(result.escalation_triggered_by_name).toBe(
      "複数課題の関連性判定が必要な場合"
    );
  });
});