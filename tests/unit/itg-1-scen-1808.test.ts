import { extractMonthlyReportData } from "../../src/logic/monthly-performance-analysis";

describe("月次レポート生成機能", () => {
  test("SCEN-1808: プロジェクトマネージャー連絡先が空文字の状態でレポート生成するとエラーになる", () => {
    const targetYear = 2024;
    const targetMonth = 1;
    const projectManagerContact = "";

    const input = {
      targetYear,
      targetMonth,
      projectManagerContact,
    };

    expect(() => extractMonthlyReportData(input)).toThrow(
      /プロジェクトマネージャー連絡先/
    );
  });
});