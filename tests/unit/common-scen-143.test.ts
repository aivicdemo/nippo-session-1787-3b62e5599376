import { describe, test, expect, beforeEach, jest } from "@jest/globals";
import { sendUnsubmittedReminder } from "../../src/logic/notification-delivery";

describe("notification-delivery", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-143: [normal] 課題検索から可視化レポート作成までの自動実行 AIエージェント
  test("should complete normal case without human approval and return final visualization report", async () => {
    const input_unsubmitted_members = [
      {
        member_id: "MEM001",
        member_name: "Alice",
        report_date: "2024-01-15",
      },
      {
        member_id: "MEM002",
        member_name: "Bob",
        report_date: "2024-01-15",
      },
    ];

    const expected_reminder_count = input_unsubmitted_members.length;
    const expected_notification_status = "sent";
    const expected_escalation_triggered = false;

    const result = await sendUnsubmittedReminder(input_unsubmitted_members);

    expect(result.reminder_count).toBe(expected_reminder_count);
    expect(result.notification_status).toBe(expected_notification_status);
    expect(result.escalation_triggered).toBe(expected_escalation_triggered);
    expect(result.unsubmitted_members).toEqual(input_unsubmitted_members);
    expect(result.timestamp).toBeDefined();
  });
});