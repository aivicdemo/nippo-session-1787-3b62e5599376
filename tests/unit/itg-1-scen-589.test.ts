import { calculateIssuePriorityScore } from "../../src/logic/issue-extraction-prioritization";

describe("課題優先度判定機能 - チーム波及度スコア小数点エラー", () => {
  test("SCEN-589: チーム波及度スコアが小数点型で渡されたとき計算エラーが発生する", () => {
    const input = {
      issueId: "issue-001",
      issueContent: "データベース接続タイムアウトが発生している",
      occurrenceFrequency: 3,
      impactScore: 45.7,
      affectedTeamCount: 2,
      resolutionDaysAverage: 2,
      reportingDate: "2024-01-15T08:00:00Z",
      teamId: "team-alpha",
    };

    expect(() => calculateIssuePriorityScore(input)).toThrow(
      /Invalid score format/
    );
  });
});