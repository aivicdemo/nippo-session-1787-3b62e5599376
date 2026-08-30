import { calculatePriorityScoreForIssue } from "../../src/logic/priority-scoring-engine";

describe("朝会報告管理システム", () => {
  test("SCEN-244: 発生頻度が0のときに過去30日間の課題発生履歴データが不足していることを示すエラーが発生する", () => {
    const input = {
      issueId: "ISSUE-001",
      frequency: 0,
      impactScore: 50,
    };

    expect(() => calculatePriorityScoreForIssue(input)).toThrow(
      /過去30日間の課題発生履歴/
    );
  });
});