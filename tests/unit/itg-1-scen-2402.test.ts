import { extractMonthlyReportData } from "../../src/logic/monthly-performance-analysis";

describe("朝会報告管理システム", () => {
  test("SCEN-2402: [error] 日報データ集約・アーカイブ移行機能 - 移行対象の日報データが存在しないとき処理が中断される", async () => {
    // 移行対象期間: 2026年1月1日～2026年1月31日
    const archiveStartDate = new Date("2026-01-01T00:00:00Z");
    const archiveEndDate = new Date("2026-01-31T23:59:59Z");

    // 入力: 対象期間内にデータが存在しない状態
    const input = {
      targetYear: 2026,
      targetMonth: 1,
      requestedByUserId: "user-admin-001",
      teamIdFilter: undefined,
      archiveStartDate,
      archiveEndDate,
    };

    // 期待結果: ERR_NO_TARGET_DATA_FOUND エラーが throw される
    expect(() => extractMonthlyReportData(input)).toThrow(/NO_TARGET_DATA_FOUND/);
  });
});