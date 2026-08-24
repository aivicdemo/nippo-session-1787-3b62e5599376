import { prioritizeAndColorizeIssues } from "../../src/logic/issue-extraction-prioritization";

describe("課題優先度色分け表示機能", () => {
  // SCEN-679: [error] 課題優先度色分け表示機能 - 課題リストが配列でなくオブジェクトのとき型チェックエラーになる
  test("課題リストがオブジェクト型の場合、型チェックエラーが発生する", () => {
    const invalidIssueList = {
      id: 1,
      title: "課題A",
    };

    const input = {
      issues: invalidIssueList as any,
      colorThresholds: {
        redThresholdMin: 70,
        yellowThresholdMin: 40,
      },
      requestedBy: "user-001",
    };

    expect(() => prioritizeAndColorizeIssues(input)).toThrow(/配列/);
  });
});