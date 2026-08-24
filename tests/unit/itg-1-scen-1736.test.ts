import { describe, test, expect } from "@jest/globals";
import { prioritizeAndColorizeIssues } from "../../src/logic/issue-extraction-prioritization";

describe("優先度スコアに基づく色分け表示機能", () => {
  test("SCEN-1736: 課題優先度スコア配列が空配列のときエラーになる", () => {
    const input = {
      issues: [],
      colorThresholds: {
        redThresholdMin: 70,
        yellowThresholdMin: 40,
      },
      requestedBy: "user-001",
    };

    expect(() => prioritizeAndColorizeIssues(input)).toThrow(/配列|空/);
  });
});