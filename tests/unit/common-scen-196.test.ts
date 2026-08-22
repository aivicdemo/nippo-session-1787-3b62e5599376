import { describe, test, expect, beforeEach, jest } from "@jest/globals";
import { sendUnsubmittedReminder } from "../../src/logic/notification-delivery";

describe("notification-delivery", () => {
  test("SCEN-196: [normal] 日報収集・確認・催促の自動化エージェント AIエージェント - 期限までに未提出のメンバーに自動催促通知を送る", async () => {
    // Setup: テスト用のメモリ内DB（日報提出状況）にメンバー10名のデータを設定
    const unsubmittedMembers = [
      {
        member_id: "member-001",
        member_name: "田中太郎",
        member_email: "tanaka.taro@company.com",
        team_id: "team-001",
        submission_status: "unsubmitted" as const,
        expected_submission_time: new Date("2024-01-15T09:00:00Z"),
        last_reminder_sent_at: null,
      },
      {
        member_id: "member-002",
        member_name: "佐藤花子",
        member_email: "sato.hanako@company.com",
        team_id: "team-001",
        submission_status: "unsubmitted" as const,
        expected_submission_time: new Date("2024-01-15T09:00:00Z"),
        last_reminder_sent_at: null,
      },
      {
        member_id: "member-003",
        member_name: "鈴木次郎",
        member_email: "suzuki.jiro@company.com",
        team_id: "team-002",
        submission_status: "unsubmitted" as const,
        expected_submission_time: new Date("2024-01-15T09:00:00Z"),
        last_reminder_sent_at: null,
      },
    ];

    // 本日の期限時刻（09:00）を過ぎた状態をシミュレート
    const current_timestamp = new Date("2024-01-15T09:30:00Z");
    const deadline_time_str = "09:00";

    // スタブ化したメール送信関数
    const mockEmailSend = jest.fn().mockResolvedValue({
      status: "success",
      message_id: "msg-001",
    });

    // スタブ化した監査ログ記録関数
    const mockAuditLog = jest.fn().mockResolvedValue({
      audit_id: "audit-001",
      timestamp: current_timestamp,
    });

    // スタブ化した履歴記録関数
    const mockHistoryRecord = jest.fn().mockResolvedValue({
      history_id: "hist-001",
      recorded_at: current_timestamp,
    });

    // sendUnsubmittedReminderの呼び出し
    const result = await sendUnsubmittedReminder({
      unsubmitted_members: unsubmittedMembers,
      current_timestamp,
      deadline_time_str,
      email_send_fn: mockEmailSend,
      audit_log_fn: mockAuditLog,
      history_record_fn: mockHistoryRecord,
    });

    // 確認項目1: 催促通知送信処理が実行されたことを確認
    expect(mockEmailSend).toHaveBeenCalled();

    // 確認項目2: 送信されたメール内容を検証
    expect(mockEmailSend).toHaveBeenCalledTimes(3); // 3名の未提出メンバーに送信

    const firstCall = mockEmailSend.mock.calls[0][0];
    expect(firstCall.to).toBe("tanaka.taro@company.com");
    expect(firstCall.subject).toMatch(/日報提出のお願い/);
    expect(firstCall.body).toContain("田中太郎");
    expect(firstCall.body).toContain("本日09:00までに提出ください");

    const secondCall = mockEmailSend.mock.calls[1][0];
    expect(secondCall.to).toBe("sato.hanako@company.com");
    expect(secondCall.subject).toMatch(/日報提出のお願い/);
    expect(secondCall.body).toContain("佐藤花子");
    expect(secondCall.body).toContain("本日09:00までに提出ください");

    const thirdCall = mockEmailSend.mock.calls[2][0];
    expect(thirdCall.to).toBe("suzuki.jiro@company.com");
    expect(thirdCall.subject).toMatch(/日報提出のお願い/);
    expect(thirdCall.body).toContain("鈴木次郎");
    expect(thirdCall.body).toContain("本日09:00までに提出ください");

    // 確認項目3: 監査ログに記録されたイベントを検証
    expect(mockAuditLog).toHaveBeenCalled();
    const auditLogCall = mockAuditLog.mock.calls[0][0];
    expect(auditLogCall.action_id).toBe("action-02");
    expect(auditLogCall.action_name).toBe("催促通知送信");
    expect(auditLogCall.timestamp).toEqual(current_timestamp);
    expect(auditLogCall.affected_members_count).toBe(3);
    expect(auditLogCall.send_result).toBe("success");

    // 確認項目4: 催促通知送信後、メモリ内DBの催促履歴に記録されていることを確認
    expect(mockHistoryRecord).toHaveBeenCalled();
    expect(mockHistoryRecord).toHaveBeenCalledTimes(3);

    const firstHistoryRecord = mockHistoryRecord.mock.calls[0][0];
    expect(firstHistoryRecord.member_id).toBe("member-001");
    expect(firstHistoryRecord.send_timestamp).toEqual(current_timestamp);
    expect(firstHistoryRecord.send_reason).toBe("期限超過未提出");

    const secondHistoryRecord = mockHistoryRecord.mock.calls[1][0];
    expect(secondHistoryRecord.member_id).toBe("member-002");
    expect(secondHistoryRecord.send_timestamp).toEqual(current_timestamp);
    expect(secondHistoryRecord.send_reason).toBe("期限超過未提出");

    const thirdHistoryRecord = mockHistoryRecord.mock.calls[2][0];
    expect(thirdHistoryRecord.member_id).toBe("member-003");
    expect(thirdHistoryRecord.send_timestamp).toEqual(current_timestamp);
    expect(thirdHistoryRecord.send_reason).toBe("期限超過未提出");

    // 期待結果の検証
    expect(result.status).toBe("success");
    expect(result.sent_count).toBe(3);
    expect(result.duplicated_reminders).toBe(0);
    expect(result.affected_members).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ member_id: "member-001" }),
        expect.objectContaining({ member_id: "member-002" }),
        expect.objectContaining({ member_id: "member-003" }),
      ])
    );
    expect(result.execution_timestamp).toEqual(current_timestamp);
  });
});