import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { detectAndNotifyUnsubmittedMembers } from "../../src/logic/submission-status-tracking";
import { type DetectUnsubmittedMembersInput, type DetectUnsubmittedMembersOutput, type NotificationFailure } from "../../src/logic/submission-status-tracking";

describe("detectAndNotifyUnsubmittedMembers - 月末日朝会時刻での催促判定", () => {
  // SCEN-2879
  test("月末日の朝会時刻（09:00:00）に未提出メンバーへ催促通知が正常に送信される", async () => {
    // テスト用の固定日時：2月28日（月末日）09:00:00 UTC
    const monthEndDate = new Date("2024-02-28T09:00:00Z");
    const teamId = "team-001";
    const reportDate = "2024-02-28";
    const morningMeetingStartTime = "09:00";
    const executorUserId = "user-manager-001";

    // 未提出メンバーのモックデータ
    const unsubmittedMembers = [
      {
        userId: "user-eng-001",
        userName: "エンジニア1",
        email: "engineer1@example.com",
        remainingMinutes: 5,
      },
      {
        userId: "user-eng-002",
        userName: "エンジニア2",
        email: "engineer2@example.com",
        remainingMinutes: 5,
      },
      {
        userId: "user-eng-003",
        userName: "エンジニア3",
        email: "engineer3@example.com",
        remainingMinutes: 5,
      },
    ];

    // NotificationServiceAdapterのモック
    const sendReminderNotificationCalls: Array<{
      userId: string;
      notificationType: string;
      timestamp: Date;
    }> = [];

    const mockNotificationServiceAdapter = {
      sendReminderNotification: async (
        userId: string,
        notificationType: string,
        timestamp: Date
      ): Promise<{ status: string; sentAt: Date }> => {
        sendReminderNotificationCalls.push({
          userId,
          notificationType,
          timestamp,
        });
        return {
          status: "sent",
          sentAt: timestamp,
        };
      },
    };

    // テスト入力の構築
    const input: DetectUnsubmittedMembersInput = {
      teamId,
      reportDate,
      morningMeetingStartTime,
      executorUserId,
    };

    // 実際のロジック実行（モック化されたアダプタを渡す）
    const result: DetectUnsubmittedMembersOutput =
      await detectAndNotifyUnsubmittedMembers(input, {
        notificationAdapter: mockNotificationServiceAdapter,
        currentDateTime: monthEndDate,
        unsubmittedMembersData: unsubmittedMembers,
      });

    // 期待値の検証

    // 1. 未提出メンバー数が正しいこと
    expect(result.unsubmittedMembers.length).toBe(3);

    // 2. 通知送信件数が未提出メンバー数と一致すること
    expect(result.notificationsSent).toBe(3);

    // 3. 通知送信失敗がないこと
    expect(result.notificationFailures.length).toBe(0);

    // 4. NotificationServiceAdapterのsendReminderNotificationメソッドが全未提出メンバーに対して呼び出されたことを確認
    expect(sendReminderNotificationCalls.length).toBe(3);

    // 5. 各通知呼び出しのパラメータが正確であることを確認
    // ユーザーID検証
    expect(sendReminderNotificationCalls[0].userId).toBe("user-eng-001");
    expect(sendReminderNotificationCalls[1].userId).toBe("user-eng-002");
    expect(sendReminderNotificationCalls[2].userId).toBe("user-eng-003");

    // 通知タイプ検証
    expect(sendReminderNotificationCalls[0].notificationType).toBe(
      "morning_meeting_reminder"
    );
    expect(sendReminderNotificationCalls[1].notificationType).toBe(
      "morning_meeting_reminder"
    );
    expect(sendReminderNotificationCalls[2].notificationType).toBe(
      "morning_meeting_reminder"
    );

    // タイムスタンプ検証（月末日09:00:00）
    expect(sendReminderNotificationCalls[0].timestamp.toISOString()).toBe(
      "2024-02-28T09:00:00.000Z"
    );
    expect(sendReminderNotificationCalls[1].timestamp.toISOString()).toBe(
      "2024-02-28T09:00:00.000Z"
    );
    expect(sendReminderNotificationCalls[2].timestamp.toISOString()).toBe(
      "2024-02-28T09:00:00.000Z"
    );

    // 6. 実行日時がISO8601形式で記録されていること
    expect(result.executedAt).toBe("2024-02-28T09:00:00.000Z");

    // 7. 各メンバーのメール、ユーザーID、表示名が結果に含まれていること
    const resultUserIds = result.unsubmittedMembers.map((m) => m.userId);
    expect(resultUserIds).toContain("user-eng-001");
    expect(resultUserIds).toContain("user-eng-002");
    expect(resultUserIds).toContain("user-eng-003");

    const resultEmails = result.unsubmittedMembers.map((m) => m.email);
    expect(resultEmails).toContain("engineer1@example.com");
    expect(resultEmails).toContain("engineer2@example.com");
    expect(resultEmails).toContain("engineer3@example.com");
  });
});