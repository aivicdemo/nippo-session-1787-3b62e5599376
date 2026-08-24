import { sendDailyReportReminder } from "../../src/logic/submission-status-tracking";
import type {
  SendDailyReportReminderInput,
  SendDailyReportReminderOutput,
  ReminderNotificationDetail,
} from "../../src/logic/submission-status-tracking";

describe("毎朝の定時にチームメンバーへ報告入力のリマインド通知を自動送信し、報告期限までの時間を表示する機能", () => {
  // SCEN-392: [edge] 定時リマインド送信機能 - チームメンバーリストに重複ユーザーが含まれるとき、通知は重複なく1回のみ配信される
  test("チームメンバーリストに重複ユーザーが含まれる場合、重複ユーザーへの通知は1回のみ配信される", async () => {
    const scheduledTime = new Date("2024-01-15T08:30:00Z");
    const reportDeadlineTime = new Date("2024-01-15T09:00:00Z");
    const teamIds = ["team-001"];
    const notificationChannels: ("email" | "in_app" | "slack")[] = [
      "email",
      "in_app",
    ];

    const mockSendReminderNotificationCalls: Array<{
      userId: string;
      channel: string;
    }> = [];

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn(async (userId: string, channel: string) => {
        mockSendReminderNotificationCalls.push({ userId, channel });
        return {
          success: true,
          sentAt: new Date("2024-01-15T08:30:05Z"),
        };
      }),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    const mockTeamMembersWithDuplicates = [
      {
        userId: "user-001",
        userName: "Alice",
        email: "alice@example.com",
        remainingMinutes: 30,
      },
      {
        userId: "user-002",
        userName: "Bob",
        email: "bob@example.com",
        remainingMinutes: 30,
      },
      {
        userId: "user-001",
        userName: "Alice",
        email: "alice@example.com",
        remainingMinutes: 30,
      },
      {
        userId: "user-003",
        userName: "Charlie",
        email: "charlie@example.com",
        remainingMinutes: 30,
      },
      {
        userId: "user-002",
        userName: "Bob",
        email: "bob@example.com",
        remainingMinutes: 30,
      },
    ];

    const mockDataProvider = {
      getTeamMembers: jest.fn().mockResolvedValue(mockTeamMembersWithDuplicates),
      getReportSubmissionStatus: jest.fn().mockResolvedValue([]),
      recordNotificationLog: jest.fn().mockResolvedValue(undefined),
    };

    const input: SendDailyReportReminderInput = {
      scheduledTime,
      teamIds,
      reportDeadlineTime,
      notificationChannels,
    };

    const result: SendDailyReportReminderOutput = await sendDailyReportReminder(
      input,
      mockNotificationServiceAdapter,
      mockDataProvider
    );

    const uniqueUserIds = new Set(
      mockSendReminderNotificationCalls.map((call) => call.userId)
    );
    expect(uniqueUserIds.size).toBe(3);
    expect(uniqueUserIds.has("user-001")).toBe(true);
    expect(uniqueUserIds.has("user-002")).toBe(true);
    expect(uniqueUserIds.has("user-003")).toBe(true);

    const user001Calls = mockSendReminderNotificationCalls.filter(
      (call) => call.userId === "user-001"
    );
    expect(user001Calls.length).toBe(2);
    expect(user001Calls.every((call) => notificationChannels.includes(call.channel as any))).toBe(true);

    const user002Calls = mockSendReminderNotificationCalls.filter(
      (call) => call.userId === "user-002"
    );
    expect(user002Calls.length).toBe(2);

    const user003Calls = mockSendReminderNotificationCalls.filter(
      (call) => call.userId === "user-003"
    );
    expect(user003Calls.length).toBe(1);

    expect(result.sentCount).toBe(6);
    expect(result.failedCount).toBe(0);
    expect(result.remainingTimeMinutes).toBe(30);

    expect(result.notificationDetails.length).toBeGreaterThan(0);
    const sentDetails = result.notificationDetails.filter(
      (detail) => detail.status === "sent"
    );
    expect(sentDetails.length).toBe(6);

    expect(mockDataProvider.recordNotificationLog).toHaveBeenCalled();
    const recordCalls = mockDataProvider.recordNotificationLog.mock.calls;
    expect(recordCalls.length).toBe(6);

    const loggedUserIds = recordCalls.map((call) => call[0]?.userId);
    const loggedUser001Count = loggedUserIds.filter(
      (id) => id === "user-001"
    ).length;
    const loggedUser002Count = loggedUserIds.filter(
      (id) => id === "user-002"
    ).length;
    const loggedUser003Count = loggedUserIds.filter(
      (id) => id === "user-003"
    ).length;

    expect(loggedUser001Count).toBe(2);
    expect(loggedUser002Count).toBe(2);
    expect(loggedUser003Count).toBe(1);
  });
});