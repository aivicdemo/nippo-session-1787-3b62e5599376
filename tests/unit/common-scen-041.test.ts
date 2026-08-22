import { describe, test, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { detectAndNotifyUnsubmitted } from "../../src/logic/submission-status-management";

describe("submission-status-management", () => {
  // SCEN-041: [normal] 日報収集から課題抽出・配信までの自律実行 AIエージェント
  test("should execute Action 1 at scheduled time to check all members daily report receipt status", async () => {
    const scheduledTime = new Date("2024-01-15T08:00:00Z");
    const allMembers = Array.from({ length: 10 }, (_, i) => ({
      id: `member_${i + 1}`,
      email: `member${i + 1}@example.com`,
      name: `Member ${i + 1}`,
    }));

    const mockAiClient = {
      callAction01CheckReceiptStatus: jest.fn().mockResolvedValue({
        status: "completed",
        members_checked: 10,
        members_received: 10,
        members_pending: 0,
        last_receipt_time: new Date("2024-01-15T08:05:00Z").toISOString(),
      }),
      callAction02CreateUnsubmittedList: jest
        .fn()
        .mockResolvedValue({ status: "completed", pending_members: [] }),
      callAction03SendNotifications: jest
        .fn()
        .mockResolvedValue({ status: "completed", notified_count: 0 }),
      callAction04ExtractChallenges: jest
        .fn()
        .mockResolvedValue({ status: "completed", challenges: [] }),
      callAction05PrioritizeChallenges: jest
        .fn()
        .mockResolvedValue({ status: "completed", prioritized_challenges: [] }),
      callAction06GenerateConfirmationEmail: jest
        .fn()
        .mockResolvedValue({ status: "completed", email_id: "email_123" }),
    };

    const auditEvents: Array<{
      timestamp: string;
      action: string;
      target_members: number;
      received_count: number;
      pending_count: number;
    }> = [];

    const executionLogs: string[] = [];

    const internalLogger = {
      info: (message: string) => {
        executionLogs.push(message);
      },
    };

    const result = await detectAndNotifyUnsubmitted({
      members: allMembers,
      scheduledTime,
      aiClient: mockAiClient,
      auditEvents,
      logger: internalLogger,
    });

    expect(mockAiClient.callAction01CheckReceiptStatus).toHaveBeenCalledTimes(1);

    const action01Call = mockAiClient.callAction01CheckReceiptStatus.mock
      .calls[0];
    expect(action01Call[0]).toMatchObject({
      members_to_check: 10,
      timestamp: scheduledTime.toISOString(),
    });

    expect(result.action_1_result).toBeDefined();
    expect(result.action_1_result.status).toBe("completed");
    expect(result.action_1_result.members_checked).toBe(10);
    expect(result.action_1_result.members_received).toBe(10);
    expect(result.action_1_result.members_pending).toBe(0);

    const checkStatusAuditEvent = auditEvents.find(
      (e) => e.action === "CHECK_DAILY_REPORT_RECEIPT_STATUS"
    );
    expect(checkStatusAuditEvent).toBeDefined();
    expect(checkStatusAuditEvent).toMatchObject({
      timestamp: "2024-01-15T08:00:00Z",
      action: "CHECK_DAILY_REPORT_RECEIPT_STATUS",
      target_members: 10,
      received_count: 10,
      pending_count: 0,
    });

    const logMessage = executionLogs.find((msg) =>
      msg.includes("全メンバー（10名）の日報受信状況確認処理が開始された")
    );
    expect(logMessage).toBeDefined();
  });
});