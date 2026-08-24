import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { generateAndSendSummaryEmail } from "../../src/logic/notification-delivery";
import type {
  GenerateAndSendSummaryEmailInput,
  GenerateAndSendSummaryEmailOutput,
} from "../../src/logic/notification-delivery";

describe("朝会報告メール送信機能 - 通知配信失敗時の内部キュー保存", () => {
  let mockNotificationAdapter: any;
  let mockQueueStorage: any;
  let mockDashboardUpdater: any;

  beforeEach(() => {
    mockQueueStorage = {
      save: jest.fn().mockResolvedValue(undefined),
      query: jest.fn().mockResolvedValue([]),
    };

    mockDashboardUpdater = {
      updateStatus: jest.fn().mockResolvedValue(undefined),
    };

    mockNotificationAdapter = {
      sendReminderNotification: jest
        .fn()
        .mockRejectedValue(new Error("DELIVERY_FAILED")),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-230
  test("NotificationServiceAdapter が通知配信に失敗したとき、通知は内部キューに一時保存される", async () => {
    const input: GenerateAndSendSummaryEmailInput = {
      teamId: "team-001",
      reportDate: "2024-01-15",
      managerUserId: "mgr-001",
      submittedReports: [
        {
          reporterId: "emp-001",
          reporterName: "田中太郎",
          submittedAt: "2024-01-15T08:45:00Z",
          challenges: ["データベース接続タイムアウト"],
        },
        {
          reporterId: "emp-002",
          reporterName: "鈴木花子",
          submittedAt: "2024-01-15T08:50:00Z",
          challenges: ["API レート制限エラー"],
        },
      ],
      unsubmittedMemberIds: ["emp-003"],
      reportDeadlineTime: "09:00",
    };

    const beforeTime = new Date();
    let capturedQueueRecord: any = null;

    mockNotificationAdapter.sendReminderNotification.mockImplementation(
      async (payload: any) => {
        // 失敗時のシミュレーション
        throw new Error("Service unavailable");
      }
    );

    mockQueueStorage.save.mockImplementation(async (record: any) => {
      capturedQueueRecord = record;
    });

    const result = await generateAndSendSummaryEmail(input, {
      notificationAdapter: mockNotificationAdapter,
      queueStorage: mockQueueStorage,
      dashboardUpdater: mockDashboardUpdater,
    });

    // 失敗時も emailId は発行される（キュー用）
    expect(result).toHaveProperty("emailId");
    expect(result.emailId).toMatch(/^email-queued-/);

    // 配信ログに失敗が記録される
    expect(mockQueueStorage.save).toHaveBeenCalled();

    // キューレコードの検証
    expect(capturedQueueRecord).toBeDefined();
    expect(capturedQueueRecord.status).toBe("QUEUED_FOR_RETRY");
    expect(capturedQueueRecord.retry_count).toBe(0);
    expect(capturedQueueRecord.recipient_user_id).toBe("mgr-001");
    expect(capturedQueueRecord.payload).toEqual(
      expect.objectContaining({
        teamId: "team-001",
        reportDate: "2024-01-15",
      })
    );

    // next_retry_time が現在時刻から5分後（300秒後）に設定
    const nextRetryTime = new Date(capturedQueueRecord.next_retry_time);
    const expectedMinRetryTime = new Date(beforeTime.getTime() + 5 * 60 * 1000);
    const expectedMaxRetryTime = new Date(beforeTime.getTime() + 6 * 60 * 1000);
    expect(nextRetryTime.getTime()).toBeGreaterThanOrEqual(
      expectedMinRetryTime.getTime()
    );
    expect(nextRetryTime.getTime()).toBeLessThanOrEqual(
      expectedMaxRetryTime.getTime()
    );

    // ダッシュボードが遅延状態に更新される
    expect(mockDashboardUpdater.updateStatus).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "DELAYED",
        message: "通知送信に遅延が発生しています",
      })
    );

    // 配信されなかったことを確認
    expect(result.sentAt).toBeUndefined();
  });
});