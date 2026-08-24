import { describe, test, expect } from "@jest/globals";
import { prioritizeAndColorizeIssues } from "../../src/logic/issue-extraction-prioritization";
import type { IssueSummary, ColorThresholdConfig, ColorizedIssueList } from "../../src/logic/issue-extraction-prioritization";

describe("優先度の高い課題を部長向けダッシュボードで強調表示（色分け・ハイライト）する機能", () => {
  // SCEN-1645: [error] 部長ダッシュボード強調表示機能 - 優先度スコアが100を超える値のまま色分け・ハイライト処理を実行しようとしたとき、処理を中止しエラーを返す
  test("should reject and return error when priority score exceeds 100", () => {
    const issues: IssueSummary[] = [
      {
        issueId: "issue-001",
        priorityScore: 101,
        keyword: "データベース接続エラー",
        impactLevel: "high",
      },
      {
        issueId: "issue-002",
        priorityScore: 85,
        keyword: "API応答遅延",
        impactLevel: "medium",
      },
    ];

    const colorThresholds: ColorThresholdConfig = {
      redThresholdMin: 70,
      yellowThresholdMin: 40,
    };

    const requestedBy = "manager-001";

    const result = prioritizeAndColorizeIssues(
      issues,
      colorThresholds,
      requestedBy
    );

    expect(result).toHaveProperty("error");
    expect(result.error).toMatch(/優先度スコア/);
    expect(result.error).toMatch(/100/);
    expect(result).toHaveProperty("errorCode");
    expect(result.errorCode).toBe("PRIORITY_SCORE_OUT_OF_RANGE");
    expect(result).not.toHaveProperty("colorizedIssues");
  });
});