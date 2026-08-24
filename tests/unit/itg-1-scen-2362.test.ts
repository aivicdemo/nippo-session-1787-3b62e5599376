import { describe, test, expect } from "@jest/globals";
import { extractMonthlyReportData } from "../../src/logic/monthly-performance-analysis";

describe("朝会報告集約分析機能 - 月次レポートデータ抽出", () => {
  // SCEN-2362
  test("終了日が空文字列のとき ValidationError がスローされる", () => {
    const input = {
      targetYear: 2024,
      targetMonth: 1,
      requestedByUserId: "user-001",
      teamIdFilter: ["team-001"],
      extractionPeriodStart: "2024-01-01T00:00:00Z",
      extractionPeriodEnd: "",
    };

    expect(() => extractMonthlyReportData(input)).toThrow(/終了日/);
  });
});