import { describe, test, expect } from "@jest/globals";
import { extractMonthlyReportData } from "../../src/logic/monthly-performance-analysis";

describe("月次レポートデータ抽出機能", () => {
  // SCEN-2327
  test("開始日が終了日より後の日付のとき処理を中止しエラーを返す", () => {
    const input = {
      targetYear: 2026,
      targetMonth: 1,
      requestedByUserId: "user_001",
      teamIdFilter: undefined,
    };

    const startDate = new Date("2026-01-15T00:00:00Z");
    const endDate = new Date("2026-01-10T23:59:59Z");

    expect(() =>
      extractMonthlyReportData(
        {
          ...input,
          extractionStartDate: startDate,
          extractionEndDate: endDate,
        },
        undefined
      )
    ).toThrow(/開始日/);
  });
});