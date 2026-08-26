import { initializeScheduler } from "../../src/logic/remind-notification-scheduler";

describe("Remind Notification Scheduler", () => {
  test("SCEN-051: initializeScheduler should throw error when invalid schedule configuration is detected", () => {
    const invalidScheduleConfig = {
      schedules: [
        {
          scheduleId: "sched-001",
          notificationTime: "25:00:00",
          dayOfWeek: "invalid-day",
          recipientEmails: [],
        },
      ],
    };

    expect(() => initializeScheduler(invalidScheduleConfig)).toThrow(
      /無効なスケジュール設定が検出されました/
    );
  });
});