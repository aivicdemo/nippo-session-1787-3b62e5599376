import { extractMonthlyReportData } from "../../src/logic/monthly-performance-analysis";

describe("朝会報告管理システム - 月次レポートデータ抽出", () => {
  // SCEN-2409
  test("終了日の形式が不正なとき処理が中断される", () => {
    const invalidEndDates = [
      "2024-13-45",
      "2024/12/32",
      "2024年12月25日",
      "25/12/2024",
      "2024-12",
      "12-25",
      "invalid",
      "",
    ];

    invalidEndDates.forEach((invalidEndDate) => {
      expect(() => {
        extractMonthlyReportData({
          targetYear: 2024,
          targetMonth: 12,
          requestedByUserId: "user-001",
          teamIdFilter: ["team-001"],
          extractionEndDate: invalidEndDate,
        });
      }).toThrow(/形式/);
    });
  });
});