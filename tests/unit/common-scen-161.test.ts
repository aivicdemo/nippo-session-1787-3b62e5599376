import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { sendUnsubmittedReminder } from "../../src/logic/notification-delivery";

describe("notification-delivery", () => {
  test("SCEN-161: [normal] 日報集約から分析報告までの自動実行エージェント - 未提出メンバーを特定し催促通知を送信する", async () => {
    // テスト用の日報データセットを準備: 10名中8名が指定期間内に日報を提出済み、2名（メンバーA、メンバーB）が未提出
    const submittedMemberIds = [
      "member_001",
      "member_002",
      "member_003",
      "member_004",
      "member_005",
      "member_006",
      "member_007",
      "member_008",
    ];
    const unsubmittedMemberIds = ["member_A", "member_B"];
    const allMemberIds = [...submittedMemberIds, ...unsubmittedMemberIds];

    const reportDataset = {
      period_start: "2024-01-15T00:00:00Z",
      period_end: "2024-01-15T23:59:59Z",
      all_members: allMemberIds.map((memberId) => ({
        member_id: memberId,
        member_name:
          memberId === "member_A"
            ? "Member A"
            : memberId === "member_B"
              ? "Member B"
              : `Member ${memberId}`,
      })),
      submitted_reports: submittedMemberIds.map((memberId) => ({
        member_id: memberId,
        submitted_at: "2024-01-15T10:00:00Z",
        content: "Sample report content",
      })),
    };

    // フェイクAIクライアントの作成
    const fakeAiClient = {
      callAction02IdentifyUnsubmittedMembers: async (prompt: string) => ({
        unsubmitted_member_ids: unsubmittedMemberIds,
        reminder_targets: [
          {
            member_id: "member_A",
            member_name: "Member A",
            last_submitted_at: null,
          },
          {
            member_id: "member_B",
            member_name: "Member B",
            last_submitted_at: null,
          },
        ],
        message_template:
          "日報がまだ提出されていません。本日中のご提出をお願いいたします。",
      }),
    };

    // 催促通知送信のスタブ記録
    const sentReminders: Array<{
      member_id: string;
      sent_at: string;
      message: string;
    }> = [];

    // 監査ログの記録
    const auditLog: Array<{
      timestamp: string;
      action: string;
      details: Record<string, unknown>;
    }> = [];

    // sendUnsubmittedReminderを呼び出し
    const result = await sendUnsubmittedReminder({
      report_dataset: reportDataset,
      ai_client: fakeAiClient as any,
      on_reminder_sent: (memberId: string, message: string) => {
        sentReminders.push({
          member_id: memberId,
          sent_at: "2024-01-15T11:00:00Z",
          message: message,
        });
        auditLog.push({
          timestamp: "2024-01-15T11:00:00Z",
          action: "REMINDER_SENT",
          details: {
            member_id: memberId,
            message_length: message.length,
          },
        });
      },
      on_audit_event: (eventType: string, details: Record<string, unknown>) => {
        auditLog.push({
          timestamp: new Date().toISOString(),
          action: eventType,
          details: details,
        });
      },
    });

    // 検証: 未提出メンバーが正確に特定されたか
    expect(result.unsubmitted_member_ids).toEqual(unsubmittedMemberIds);

    // 検証: 催促通知が2件送信されたか
    expect(sentReminders.length).toBe(2);

    // 検証: 各メンバーに対して正確に送信されたか
    expect(sentReminders[0].member_id).toBe("member_A");
    expect(sentReminders[1].member_id).toBe("member_B");

    // 検証: メッセージ内容が含まれているか
    expect(sentReminders[0].message).toContain(
      "日報がまだ提出されていません"
    );
    expect(sentReminders[1].message).toContain(
      "日報がまだ提出されていません"
    );

    // 検証: 監査ログに適切なイベントが記録されているか
    const reminderSentEvents = auditLog.filter(
      (log) => log.action === "REMINDER_SENT"
    );
    expect(reminderSentEvents.length).toBe(2);

    // 検証: べき等性 - 同じ入力で再実行してもsendUnsubmittedReminderの戻り値が同じ
    const sentReminders2: Array<{
      member_id: string;
      sent_at: string;
      message: string;
    }> = [];
    const auditLog2: Array<{
      timestamp: string;
      action: string;
      details: Record<string, unknown>;
    }> = [];

    const result2 = await sendUnsubmittedReminder({
      report_dataset: reportDataset,
      ai_client: fakeAiClient as any,
      on_reminder_sent: (memberId: string, message: string) => {
        sentReminders2.push({
          member_id: memberId,
          sent_at: "2024-01-15T11:00:00Z",
          message: message,
        });
        auditLog2.push({
          timestamp: "2024-01-15T11:00:00Z",
          action: "REMINDER_SENT",
          details: {
            member_id: memberId,
            message_length: message.length,
          },
        });
      },
      on_audit_event: (eventType: string, details: Record<string, unknown>) => {
        auditLog2.push({
          timestamp: new Date().toISOString(),
          action: eventType,
          details: details,
        });
      },
    });

    // 検証: 再実行でも同じ結果が得られるか（べき等性）
    expect(result2.unsubmitted_member_ids).toEqual(result.unsubmitted_member_ids);
    expect(sentReminders2.length).toBe(sentReminders.length);

    // 検証: 戻り値に実行結果の詳細が含まれているか
    expect(result).toHaveProperty("unsubmitted_member_ids");
    expect(result).toHaveProperty("reminder_sent_count");
    expect(result.reminder_sent_count).toBe(2);
  });
});