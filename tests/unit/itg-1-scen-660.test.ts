import { describe, test, expect } from "@jest/globals";
import { prioritizeAndColorizeIssues } from "../../src/logic/issue-extraction-prioritization";

describe("課題の影響度判定と優先度スコアの色分け表示", () => {
  // SCEN-660: [error] 課題優先度色分け表示機能 - 優先度スコアが undefined のとき色分けルールが適用されずエラーになる
  test("should throw error when priorityScore is undefined", () => {
    const invalidIssues = [
      {
        issueId: "issue-001",
        priorityScore: undefined as any,
        keyword: "ビルドエラー",
        impactLevel: "high" as const,
      },
    ];

    const colorThresholds = {
      redThresholdMin: 70,
      yellowThresholdMin: 40,
    };

    const requestedBy = "user-001";

    expect(() =>
      prioritizeAndColorizeIssues(invalidIssues, colorThresholds, requestedBy)
    ).toThrow(/priorityScore|不正|undefined/);
  });
});