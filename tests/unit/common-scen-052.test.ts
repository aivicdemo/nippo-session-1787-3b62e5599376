import { initializeScheduler, type SchedulerInitializationResult } from "../../src/logic/remind-notification-scheduler";

describe("共通 - リマインド通知スケジューラー初期化", () => {
  test("SCEN-052: スケジューラーへのスケジュール登録時にシステムエラーが発生した場合、失敗結果を返す", async () => {
    const mockDatabaseError = new Error("Database connection failed");

    const result: SchedulerInitializationResult = await initializeScheduler();

    expect(result.success).toBe(false);
    expect(result.registeredScheduleCount).toBe(0);
    expect(result.failedScheduleIds).toBeDefined();
    expect(result.failedScheduleIds.length).toBeGreaterThan(0);
    expect(() => {
      if (!result.success) {
        throw new Error("スケジューラーへのスケジュール登録に失敗しました。");
      }
    }).toThrow(/スケジューラーへのスケジュール登録に失敗しました/);
  });
});