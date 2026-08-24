import { describe, it, expect } from "@jest/globals";
import { prioritizeAndColorizeIssues } from "../../src/logic/issue-extraction-prioritization";
import type {
  PrioritizeAndColorizeIssuesInput,
  IssueSummary,
  ColorThresholdConfig,
} from "../../src/logic/issue-extraction-prioritization";

describe("優先度の高い課題を部長向けダッシュボードで強調表示する機能", () => {
  it("SCEN-1643: 優先度スコアが未指定のまま色分け・ハイライト処理を実行しようとしたときにエラーを返す", () => {
    const issuesWithMissingScore: IssueSummary[] = [
      {
        issueId: "issue-001",
        priorityScore: 85,
        keyword: "database_latency",
        impactLevel: "high",
      },
      {
        issueId: "issue-002",
        priorityScore: undefined as unknown as number,
        keyword: "missing_validation",
        impactLevel: "high",
      },
      {
        issueId: "issue-003",
        priorityScore: 45,
        keyword: "documentation_gap",
        impactLevel: "medium",
      },
    ];

    const colorThresholds: ColorThresholdConfig = {
      redThresholdMin: 70,
      yellowThresholdMin: 40,
    };

    const input: PrioritizeAndColorizeIssuesInput = {
      issues: issuesWithMissingScore,
      colorThresholds,
      requestedBy: "user-12345",
    };

    expect(() => prioritizeAndColorizeIssues(input)).toThrow(
      /優先度スコア/
    );
  });
});