import { extractAndRankIssuesFromReports, type ExtractAndRankIssuesInput } from "../../src/logic/issue-extraction-and-ranking";

describe("朝会報告管理システム - 課題抽出・優先度ランク付け", () => {
  test("SCEN-441: チームサイズが0以下のときに不正エラーをスロー", () => {
    const input: ExtractAndRankIssuesInput = {
      reports: [
        {
          reportId: "report-001",
          reportDate: new Date("2025-01-02T09:00:00Z"),
          issueText: "ビルドエラーが発生している",
          teamId: "team-A",
        },
      ],
      analysisStartDate: new Date("2025-01-01T00:00:00Z"),
      analysisEndDate: new Date("2025-01-07T23:59:59Z"),
      minimumConfidenceThreshold: 50,
      teamSize: 0,
    };

    expect(() => extractAndRankIssuesFromReports(input)).toThrow(/チーム人数設定/);
  });
});