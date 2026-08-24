import { describe, test, expect } from "@jest/globals";
import { prioritizeAndColorizeIssues } from "../../src/logic/issue-extraction-prioritization";
import type {
  PrioritizeAndColorizeIssuesInput,
  IssueSummary,
  ColorThresholdConfig,
  ColorizedIssueList,
} from "../../src/logic/issue-extraction-prioritization";

describe("優先度の高い課題を部長向けダッシュボードで強調表示（色分け・ハイライト）する機能", () => {
  // SCEN-1644
  test("優先度スコアが負の値のまま色分け・ハイライト処理を実行しようとしたとき、処理を中止しエラーを返す", () => {
    const issue_with_negative_score: IssueSummary = {
      issueId: "issue-001",
      priorityScore: -5,
      keyword: "パフォーマンス低下",
      impactLevel: "high",
    };

    const color_thresholds: ColorThresholdConfig = {
      redThresholdMin: 70,
      yellowThresholdMin: 40,
    };

    const input: PrioritizeAndColorizeIssuesInput = {
      issues: [issue_with_negative_score],
      colorThresholds: color_thresholds,
      requestedBy: "user-001",
    };

    expect(() => prioritizeAndColorizeIssues(input)).toThrow(
      /優先度スコア/
    );
  });
});