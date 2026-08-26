import { initializeScheduler } from "../../src/logic/remind-notification-scheduler";
import { type SchedulerInitializationResult } from "../../src/logic/remind-notification-scheduler";

describe("remind-notification-scheduler", () => {
  // SCEN-051
  test("should detect invalid schedule configuration and abort initialization", async () => {
    const invalidScheduleConfig = {
      schedules: [
        {
          id: "schedule-001",
          sendTime: "25:00", // Invalid: exceeds 24-hour format range
          dayOfWeek: "MON",
          recipients: ["user@example.com"],
        },
      ],
    };

    let thrownError: Error | null = null;
    try {
      await initializeScheduler(invalidScheduleConfig);
    } catch (error) {
      thrownError = error as Error;
    }

    expect(thrownError).not.toBeNull();
    expect(thrownError?.message).toMatch(/無効なスケジュール設定が検出されました。初期化を中止します。/);
  });
});