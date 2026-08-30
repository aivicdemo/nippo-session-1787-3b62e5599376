import { extractAndRankIssuesFromReports } from "../../src/logic/issue-extraction-and-ranking";
import { type ExtractAndRankIssuesInput } from "../../src/logic/issue-extraction-and-ranking";

describe("朝会報告管理システム - 課題抽出・優先度ランク付け", () => {
  test("SCEN-528: 分析開始日が分析終了日より後の場合、エラーをスロー", () => {
    const input: ExtractAndRankIssuesInput = {
      reports: [
        {
          reportId: "report-001",
          reportDate: new Date("2024-01-12T09:00:00Z"),
          issueText: "バグが発生しました",
          teamId: "team-001",
        },
      ],
      analysisStartDate: new Date("2024-01-15T00:00:00Z"),
      analysisEndDate: new Date("2024-01-10T23:59:59Z"),
    };

    expect(() => extractAndRankIssuesFromReports(input)).toThrow(
      /分析開始日は終了日より前に設定してください/
    );
  });
});