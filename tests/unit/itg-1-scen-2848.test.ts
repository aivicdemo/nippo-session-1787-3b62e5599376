import { detectAndNotifyUnsubmittedMembers } from "../../src/logic/submission-status-tracking";
import type { DetectUnsubmittedMembersInput, DetectUnsubmittedMembersOutput } from "../../src/logic/submission-status-tracking";

describe("未提出メンバー催促通知機能", () => {
  test("SCEN-2848: 初回催促通知が正常に配信されたとき、通知配信ログに成功ステータスが記録される", async () => {
    const now = new Date("2024-01-15T09:00:00Z");
    const teamId = "team_001";
    const reportDate = "2024-01-15";
    const morningMeetingStartTime = "09:00";
    const executorUserId = "admin_001";
    const targetUserId = "user_001";

    const mockNotificationLog: Array<{
      notification_id: string;
      user_id: string;
      delivery_status: "success" | "failed" | "skipped";
      delivery_timestamp: Date;
      service_type: string;
    }> = [];

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn(async () => ({
        status: "success",
        notification_id: "notif_20240115_001",
        sent_at: now,
      })),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    const mockDatabaseAdapter = {
      insertNotificationLog: jest.fn(async (log) => {
        mockNotificationLog.push(log);
        return { success: true };
      }),
      queryUnsubmittedMembers: jest.fn(async () => [
        {
          userId: targetUserId,
          userName: "Test Member",
          email: "test@example.com",
          remainingMinutes: 45,
        },
      ]),
      updateSubmissionStatus: jest.fn(),
    };

    const input: DetectUnsubmittedMembersInput = {
      teamId,
      reportDate,
      morningMeetingStartTime,
      executorUserId,
    };

    const result: DetectUnsubmittedMembersOutput = await detectAndNotifyUnsubmittedMembers(
      input,
      mockNotificationServiceAdapter,
      mockDatabaseAdapter
    );

    expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: targetUserId,
        teamId,
        reportDate,
      })
    );

    expect(mockNotificationLog).toHaveLength(1);

    const logRecord = mockNotificationLog[0];
    expect(logRecord.notification_id).toBe("notif_20240115_001");
    expect(logRecord.user_id).toBe(targetUserId);
    expect(logRecord.delivery_status).toBe("success");
    expect(logRecord.delivery_timestamp).toEqual(now);
    expect(logRecord.service_type).toMatch(/^(slack|teams)$/);

    expect(result.notificationsSent).toBe(1);
    expect(result.notificationFailures).toHaveLength(0);
    expect(result.unsubmittedMembers).toHaveLength(1);
    expect(result.unsubmittedMembers[0].userId).toBe(targetUserId);
  });
});