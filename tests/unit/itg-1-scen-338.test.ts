import { calculatePriorityScoreForIssue } from "../../src/logic/priority-scoring-engine";

describe("朝会報告管理システム - 優先度スコア計算エンジン", () => {
  test("SCEN-338: 課題キーワードが空文字列のときInvalidIssueDataErrorをスロー", () => {
    const input = {
      issueId: "ISSUE-001",
      frequency: 50,
      impactScore: 75,
    };

    expect(() => calculatePriorityScoreForIssue(input)).toThrow(
      /課題データが不完全です。発生頻度と影響度スコアが必須です。/
    );
  });
});