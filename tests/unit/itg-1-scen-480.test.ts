import { searchAndRetrieveReports } from "../../src/logic/report-search-and-retrieval";

describe("朝会報告管理システム - 日報検索・抽出と課題ランク付け", () => {
  // SCEN-480: 課題データリストが空のときの警告メッセージ検証
  test("課題データリストが空のとき、分析対象の課題データがありませんというエラーメッセージをthrowする", () => {
    const dateRange = {
      startDate: "2024-01-01",
      endDate: "2024-01-31",
    };
    const keywords: string[] = [];
    const teamIds: string[] = [];
    const reporterIds: string[] = [];
    const emptyReports: Array<{
      reportId: string;
      reportDate: string;
      submitterName: string;
      teamName: string;
      issueContent: string;
      extractedKeywords: string[];
    }> = [];

    expect(() =>
      searchAndRetrieveReports({
        dateRange,
        keywords,
        teamIds,
        reporterIds,
        reports: emptyReports,
      })
    ).toThrow(/分析対象の課題データがありません/);
  });
});