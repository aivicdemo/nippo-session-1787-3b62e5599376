import { describe, test, expect } from "@jest/globals";
import { prioritizeAndColorizeIssues } from "../../src/logic/issue-extraction-prioritization";
import type {
  PrioritizeAndColorizeIssuesInput,
  ColorThresholdConfig,
  IssueSummary,
  ColorizedIssueList,
} from "../../src/logic/issue-extraction-prioritization";

describe("prioritizeAndColorizeIssues - ダッシュボード色分け表示", () => {
  // SCEN-2984: [error] 課題ダッシュボード色分け表示機能 - 優先度スコアが空文字列のとき、色分け判定がエラーになる
  test("should throw ValidationError when priorityScore is empty string", () => {
    const colorThresholds: ColorThresholdConfig = {
      redThresholdMin: 71,
      yellowThresholdMin: 31,
    };

    const issuesWithInvalidScore: IssueSummary[] = [
      {
        issueId: "issue-001",
        priorityScore: "" as unknown as number,
        keyword: "テスト失敗",
        impactLevel: "high",
      },
    ];

    const input: PrioritizeAndColorizeIssuesInput = {
      issues: issuesWithInvalidScore,
      colorThresholds,
      requestedBy: "manager-001",
    };

    expect(() => prioritizeAndColorizeIssues(input)).toThrow(
      /優先度スコアが数値ではありません/
    );
  });
});