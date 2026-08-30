import { extractAndRankIssuesFromReports } from "../../src/logic/issue-extraction-and-ranking";
import { type ExtractAndRankIssuesInput, type RankedIssueList } from "../../src/logic/issue-extraction-and-ranking";

describe("朝会報告管理システム - 課題抽出・優先度付け", () => {
  // SCEN-216
  test("複数の日報から課題キーワードを抽出し、空文字列・30文字未満のissueTextは低信頼度として計上される", () => {
    // テスト用の日報配列を準備
    const input: ExtractAndRankIssuesInput = {
      reports: [
        {
          reportId: "report001",
          reportDate: new Date("2024-01-15"),
          issueText: "",
          teamId: "team001",
        },
        {
          reportId: "report002",
          reportDate: new Date("2024-01-15"),
          issueText: "バ",
          teamId: "team001",
        },
        {
          reportId: "report003",
          reportDate: new Date("2024-01-15"),
          issueText: "本日システム対応でリソース不足",
          teamId: "team001",
        },
      ],
      analysisStartDate: new Date("2023-12-16"),
      analysisEndDate: new Date("2024-01-15"),
      minimumConfidenceThreshold: 50,
    };

    const result: RankedIssueList = extractAndRankIssuesFromReports(input);

    // issuesフィールドの配列が空であることを検証
    expect(result.issues).toEqual([]);

    // lowConfidenceIssueCountが3以上であることを検証
    expect(result.lowConfidenceIssueCount).toBeGreaterThanOrEqual(3);

    // totalIssueCountが0であることを検証
    expect(result.totalIssueCount).toBe(0);

    // analysisTimestampが存在することを検証
    expect(result.analysisTimestamp).toBeInstanceOf(Date);

    // エラーが発生していないことを暗黙的に検証
    expect(result).toBeDefined();
  });
});