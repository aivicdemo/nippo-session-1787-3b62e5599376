import { calculateIssuePriorityScore } from "../../src/logic/issue-extraction-prioritization";

describe("課題の影響度判定と優先度スコア計算", () => {
  // SCEN-587: [error] 課題優先度判定機能 - 優先度ランクが不正な値のとき判定エラーが発生する
  test("不正な優先度ランク値が入力されたときエラーをスローする", () => {
    const invalidInput = {
      issueId: "issue-001",
      issueContent: "システム障害により朝会報告が30分遅延",
      occurrenceFrequency: 5,
      impactScore: 85,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: "2024-01-15",
      teamId: "team-alpha",
      priorityRank: -1,
    };

    expect(() =>
      calculateIssuePriorityScore(
        invalidInput.issueId,
        invalidInput.issueContent,
        invalidInput.occurrenceFrequency,
        invalidInput.impactScore,
        invalidInput.affectedTeamCount,
        invalidInput.resolutionDaysAverage,
        invalidInput.reportingDate,
        invalidInput.teamId
      )
    ).toThrow(/優先度ランク/);
  });
});