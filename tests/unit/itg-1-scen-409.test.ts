import { extractAndRankIssuesFromReports, type ExtractAndRankIssuesInput } from "../../src/logic/issue-extraction-and-ranking";

describe("朝会報告管理システム - 課題抽出・優先度付けロジック", () => {
  // SCEN-409: キーワード辞書が空のときはエラーをスロー
  test("キーワード辞書が空のとき、適切なエラーメッセージをスロー", () => {
    const input: ExtractAndRankIssuesInput = {
      reports: [
        {
          reportId: "report-001",
          reportDate: new Date("2024-01-15"),
          issueText: "ビルドエラーが頻発している",
          teamId: "team-A",
        },
        {
          reportId: "report-002",
          reportDate: new Date("2024-01-15"),
          issueText: "テスト環境が不安定",
          teamId: "team-B",
        },
      ],
      analysisStartDate: new Date("2024-01-01"),
      analysisEndDate: new Date("2024-01-31"),
      teamIds: ["team-A", "team-B"],
      minimumConfidenceThreshold: 50,
    };

    expect(() => extractAndRankIssuesFromReports(input)).toThrow(
      /課題キーワード辞書が未設定です/
    );
  });
});