import { extractWeeklyReportData } from "../../src/logic/weekly-issue-analysis";

describe("日報の課題項目から課題キーワードを自動抽出し、発生頻度でランク付けして表示する機能", () => {
  // SCEN-1627
  test("分析対象期間の開始日が未指定のとき、処理を中止しエラーを返す", () => {
    const input = {
      weekStartDate: undefined as any,
      weekEndDate: new Date("2024-01-07T23:59:59Z"),
      teamIds: ["team-001"],
      requestedByUserId: "user-001",
    };

    expect(() => extractWeeklyReportData(input)).toThrow(/開始日/);
  });
});