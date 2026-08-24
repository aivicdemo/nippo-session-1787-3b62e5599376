import { describe, test, expect } from "@jest/globals";
import { prioritizeAndColorizeIssues } from "../../src/logic/issue-extraction-prioritization";
import type {
  PrioritizeAndColorizeIssuesInput,
  IssueSummary,
  ColorThresholdConfig,
  ColorizedIssueList,
} from "../../src/logic/issue-extraction-prioritization";

describe("prioritizeAndColorizeIssues - edge case for threshold boundary", () => {
  // SCEN-685: [edge] 課題優先度色分け機能 - 優先度スコア 50 点（黄色閾値ちょうど）で黄色に色分けされる
  test("should colorize issue with priority score 50 (yellow threshold) as yellow", () => {
    const issues: IssueSummary[] = [
      {
        issueId: "issue-001",
        priorityScore: 50,
        keyword: "DBクエリパフォーマンス低下",
        impactLevel: "medium",
      },
    ];

    const colorThresholds: ColorThresholdConfig = {
      redThresholdMin: 70,
      yellowThresholdMin: 50,
    };

    const input: PrioritizeAndColorizeIssuesInput = {
      issues: issues,
      colorThresholds: colorThresholds,
      requestedBy: "user-12345",
    };

    const result: ColorizedIssueList = prioritizeAndColorizeIssues(input);

    expect(result.colorizedIssues).toHaveLength(1);
    expect(result.colorizedIssues[0].issueId).toBe("issue-001");
    expect(result.colorizedIssues[0].highlightColor).toBe("yellow");
    expect(result.colorDistribution.yellow).toBe(1);
    expect(result.colorDistribution.red).toBe(0);
    expect(result.colorDistribution.green).toBe(0);
  });
});