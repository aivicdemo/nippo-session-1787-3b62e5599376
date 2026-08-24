import { describe, test, expect } from "@jest/globals";
import { prioritizeAndColorizeIssues } from "../../src/logic/issue-extraction-prioritization";
import type {
  PrioritizeAndColorizeIssuesInput,
  ColorizedIssueList,
  IssueSummary,
  ColorThresholdConfig,
} from "../../src/logic/issue-extraction-prioritization";

describe("prioritizeAndColorizeIssues - Issue Dashboard Color Coding", () => {
  // SCEN-2988: [error] 課題ダッシュボード色分け表示機能 - 課題オブジェクトの必須プロパティ (課題 ID) が undefined のとき、色分け表示ロジックがエラーになる
  test("should throw TypeError when issueId is undefined in issues array", () => {
    const issuesWithUndefinedId: IssueSummary[] = [
      {
        issueId: undefined as any,
        priorityScore: 75,
        keyword: "Performance bottleneck",
        impactLevel: "high",
      },
      {
        issueId: "issue-002",
        priorityScore: 50,
        keyword: "Minor bug",
        impactLevel: "low",
      },
    ];

    const colorThresholds: ColorThresholdConfig = {
      redThresholdMin: 70,
      yellowThresholdMin: 40,
    };

    const input: PrioritizeAndColorizeIssuesInput = {
      issues: issuesWithUndefinedId,
      colorThresholds: colorThresholds,
      requestedBy: "user-001",
    };

    expect(() => prioritizeAndColorizeIssues(input)).toThrow(/issueId/);
  });
});