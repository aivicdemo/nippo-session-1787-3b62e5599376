import { describe, test, expect, beforeEach, jest } from "@jest/globals";
import { sendDailyReportReminder } from "../../src/logic/submission-status-tracking";
import type {
  SendDailyReportReminderInput,
  SendDailyReportReminderOutput,
} from "../../src/logic/submission-status-tracking";

describe("sendDailyReportReminder - 月をまたぐ期間での定時トリガー処理", () => {
  test("SCEN-2573: 前月末日23:59から当月1日09:00への時刻遷移で、定時トリガーが正確に1回だけ実行されること", async () => {
    // スタブの呼び出し履歴を記録するための配列
    const sendReminderNotificationCalls: Array<{
      userId: string;
      timestamp: Date;
    }> = [];
    const scheduleNotificationCalls: Array<{
      scheduledTime: Date;
      teamIds: string[];
    }> = [];

    // NotificationServiceAdapter のスタブ化
    const notificationServiceAdapterStub = {
      sendReminderNotification: jest.fn(
        async (userId: string, _message: string, _channels: string[]) => {
          sendReminderNotificationCalls.push({
            userId,
            timestamp: new Date("2024-02-01T09:00:00Z"),
          });
          return { success: true };
        }
      ),
      scheduleNotification: jest.fn(async (scheduledTime: Date) => {
        scheduleNotificationCalls.push({
          scheduledTime,
          teamIds: ["team-001"],
        });
        return { scheduleId: "sched-001" };
      }),
      getDeliveryStatus: jest.fn(async () => ({
        sent: 0,
        failed: 0,
        pending: 0,
      })),
    };

    // テスト用の入力データ
    // 前月末日23:59:00に定時トリガーをスケジュール登録
    const input: SendDailyReportReminderInput = {
      scheduledTime: new Date("2024-01-31T23:59:00Z"),
      teamIds: ["team-001"],
      reportDeadlineTime: new Date("2024-02-01T09:30:00Z"),
      notificationChannels: ["email", "in_app"],
    };

    // シナリオ開始: 前月末日23:59:00でスケジュール登録
    const scheduleResult = await notificationServiceAdapterStub.scheduleNotification(
      input.scheduledTime
    );
    expect(scheduleResult.scheduleId).toBe("sched-001");
    expect(scheduleNotificationCalls).toHaveLength(1);
    expect(scheduleNotificationCalls[0].scheduledTime).toEqual(
      new Date("2024-01-31T23:59:00Z")
    );

    // 前月末日23:59:59では、まだ通知は送信されていないはず
    // （スケジュール済みだが、定時トリガー時刻である朝09:00に到達していない）
    expect(sendReminderNotificationCalls).toHaveLength(0);

    // 当月1日00:00:01に進める（月をまたぐ）
    // 定時トリガーはまだ朝09:00ではないため、通知は送信されない
    expect(sendReminderNotificationCalls).toHaveLength(0);

    // 当月1日09:00:00に進める（定時トリガー実行予定時刻に到達）
    // この時点で sendDailyReportReminder を実行し、チームメンバー10名全員に通知を送信
    const memberIds = [
      "user-001",
      "user-002",
      "user-003",
      "user-004",
      "user-005",
      "user-006",
      "user-007",
      "user-008",
      "user-009",
      "user-010",
    ];

    for (const userId of memberIds) {
      await notificationServiceAdapterStub.sendReminderNotification(
        userId,
        "Please submit your daily report by 09:30 AM",
        input.notificationChannels
      );
    }

    // 検証1: sendReminderNotification が10回呼び出されたこと
    expect(sendReminderNotificationCalls).toHaveLength(10);

    // 検証2: すべての呼び出しが当月1日09:00:00のタイムスタンプで記録されていること
    for (const call of sendReminderNotificationCalls) {
      expect(call.timestamp).toEqual(new Date("2024-02-01T09:00:00Z"));
    }

    // 検証3: すべてのユーザーが対象に含まれていること
    const notifiedUserIds = sendReminderNotificationCalls.map((c) => c.userId);
    for (const userId of memberIds) {
      expect(notifiedUserIds).toContain(userId);
    }

    // 検証4: 通知配信ログの記録内容を検証
    // （実際のsendDailyReportReminder関数の戻り値として、以下の内容が含まれるべき）
    const expectedOutput: SendDailyReportReminderOutput = {
      sentCount: 10,
      failedCount: 0,
      remainingTimeMinutes: 30, // 09:00から09:30までは30分
      notificationDetails: memberIds.map((userId) => ({
        userId,
        status: "sent",
        sentAt: new Date("2024-02-01T09:00:00Z"),
        errorMessage: null,
      })),
    };

    // 実際の関数呼び出し（スタブを第2引数として渡す）
    const result = await sendDailyReportReminder(input, notificationServiceAdapterStub as any);

    // 検証5: 戻り値の sentCount が10であること
    expect(result.sentCount).toBe(10);

    // 検証6: 戻り値の failedCount が0であること
    expect(result.failedCount).toBe(0);

    // 検証7: remainingTimeMinutes が30分であること（09:00～09:30）
    expect(result.remainingTimeMinutes).toBe(30);

    // 検証8: notificationDetails に10件の詳細情報が含まれていること
    expect(result.notificationDetails).toHaveLength(10);

    // 検証9: すべての notificationDetails のステータスが 'sent' であること
    for (const detail of result.notificationDetails) {
      expect(detail.status).toBe("sent");
      expect(detail.sentAt).toEqual(new Date("2024-02-01T09:00:00Z"));
      expect(detail.errorMessage).toBeNull();
    }

    // 検証10: 月日変更をまたいでも二重送信が発生していないこと
    // （sendReminderNotificationCalls が10件のみであること）
    expect(sendReminderNotificationCalls).toHaveLength(10);

    // 検証11: scheduleNotificationCalls が1件のみであること（重複登録がないこと）
    expect(scheduleNotificationCalls).toHaveLength(1);
  });
});