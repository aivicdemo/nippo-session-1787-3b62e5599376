import { getDashboardData } from "../../src/logic/dashboard-display";

describe("getDashboardData", () => {
  // SCEN-208: [error] 日報収集・確認・催促の自動化エージェント AIエージェント - 権限外のデータ参照とツール操作を拒否する
  test("should deny unauthorized access to dashboard data and tool operations with audit logging", async () => {
    const audit_events: Array<{
      event_type: string;
      user_id: string;
      action: string;
      reason: string;
      timestamp: string;
    }> = [];

    // Mock AI client that simulates Tx11Imp1AiClient behavior
    const mock_ai_client = {
      action_01_get_submission_status: async (
        _context: { user_id: string; user_role: string }
      ) => {
        const denial_event = {
          event_type: "denied_authorization",
          user_id: "user_a",
          action: "action_01_get_submission_status",
          reason: "insufficient_permission",
          timestamp: new Date("2024-01-15T09:00:00Z").toISOString(),
        };
        audit_events.push(denial_event);
        throw new Error(
          "権限外ユーザーA には部門全体の日報提出状況参照権限がありません"
        );
      },

      action_02_access_member_data: async (
        _context: { user_id: string; user_role: string },
        _target_member_id: string
      ) => {
        const denial_event = {
          event_type: "denied_authorization",
          user_id: "user_a",
          action: "action_02_access_member_data",
          reason: "insufficient_permission",
          timestamp: new Date("2024-01-15T09:05:00Z").toISOString(),
        };
        audit_events.push(denial_event);
        throw new Error("ユーザーA はメンバーB の日報へのアクセス権限がありません");
      },

      action_03_query_issue_database: async (
        _context: { user_id: string; user_role: string }
      ) => {
        const denial_event = {
          event_type: "denied_authorization",
          user_id: "user_a",
          action: "action_03_query_issue_database",
          reason: "insufficient_permission",
          timestamp: new Date("2024-01-15T09:10:00Z").toISOString(),
        };
        audit_events.push(denial_event);
        throw new Error(
          "権限レベル:一般メンバーでは課題データベースへのアクセスが許可されていません"
        );
      },

      action_04_send_reminder_notification: async (
        _context: { user_id: string; user_role: string }
      ) => {
        const denial_event = {
          event_type: "denied_authorization",
          user_id: "user_a",
          action: "action_04_send_reminder_notification",
          reason: "insufficient_permission",
          timestamp: new Date("2024-01-15T09:15:00Z").toISOString(),
        };
        audit_events.push(denial_event);
        throw new Error("このツール操作は部長ロールのみに許可されています");
      },

      action_05_distribute_summary: async (
        _context: { user_id: string; user_role: string }
      ) => {
        const denial_event = {
          event_type: "denied_authorization",
          user_id: "user_a",
          action: "action_05_distribute_summary",
          reason: "insufficient_permission",
          timestamp: new Date("2024-01-15T09:20:00Z").toISOString(),
        };
        audit_events.push(denial_event);
        throw new Error("配信先指定権限がないため実行できません");
      },

      action_06_log_audit_event: async (
        _event: {
          event_type: string;
          user_id: string;
          action: string;
          reason: string;
          timestamp: string;
        }
      ) => {
        // Audit logging action
        return { success: true };
      },
    };

    const unauthorized_user_context = {
      user_id: "user_a",
      user_role: "一般メンバー",
    };

    // Attempt to get dashboard data with unauthorized context
    const result = await getDashboardData(
      unauthorized_user_context,
      mock_ai_client as any
    );

    // Verify that all authorization denials were captured
    expect(result.authorization_denied).toBe(true);

    // Verify error message for action 1 - get submission status
    expect(result.errors).toContain(/権限外ユーザーA には部門全体の日報提出状況参照権限がありません/);

    // Verify error message for action 2 - access member data
    expect(result.errors).toContain(/ユーザーA はメンバーB の日報へのアクセス権限がありません/);

    // Verify error message for action 3 - query issue database
    expect(result.errors).toContain(/権限レベル:一般メンバーでは課題データベースへのアクセスが許可されていません/);

    // Verify error message for action 4 - send reminder notification
    expect(result.errors).toContain(/このツール操作は部長ロールのみに許可されています/);

    // Verify error message for action 5 - distribute summary
    expect(result.errors).toContain(/配信先指定権限がないため実行できません/);

    // Verify audit events were recorded
    expect(audit_events.length).toBe(5);

    // Verify audit event format for action 1
    expect(audit_events[0]).toEqual({
      event_type: "denied_authorization",
      user_id: "user_a",
      action: "action_01_get_submission_status",
      reason: "insufficient_permission",
      timestamp: "2024-01-15T09:00:00Z",
    });

    // Verify audit event format for action 2
    expect(audit_events[1]).toEqual({
      event_type: "denied_authorization",
      user_id: "user_a",
      action: "action_02_access_member_data",
      reason: "insufficient_permission",
      timestamp: "2024-01-15T09:05:00Z",
    });

    // Verify audit event format for action 3
    expect(audit_events[2]).toEqual({
      event_type: "denied_authorization",
      user_id: "user_a",
      action: "action_03_query_issue_database",
      reason: "insufficient_permission",
      timestamp: "2024-01-15T09:10:00Z",
    });

    // Verify audit event format for action 4
    expect(audit_events[3]).toEqual({
      event_type: "denied_authorization",
      user_id: "user_a",
      action: "action_04_send_reminder_notification",
      reason: "insufficient_permission",
      timestamp: "2024-01-15T09:15:00Z",
    });

    // Verify audit event format for action 5
    expect(audit_events[4]).toEqual({
      event_type: "denied_authorization",
      user_id: "user_a",
      action: "action_05_distribute_summary",
      reason: "insufficient_permission",
      timestamp: "2024-01-15T09:20:00Z",
    });

    // Verify all denials follow the expected format pattern
    audit_events.forEach((event) => {
      expect(event.event_type).toBe("denied_authorization");
      expect(event.user_id).toBe("user_a");
      expect(event.reason).toBe("insufficient_permission");
      expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(event.timestamp)).toBe(
        true
      );
    });
  });
});