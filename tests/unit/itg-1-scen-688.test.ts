import { prioritizeAndColorizeIssues } from "../../src/logic/issue-extraction-prioritization";
import type { PrioritizeAndColorizeIssuesInput, ColorizedIssueList, IssueSummary } from "../../src/logic/issue-extraction-prioritization";

describe("課題の影響度判定と優先度色分け機能", () => {
  // SCEN-688: [edge] 課題優先度色分け機能 - 優先度スコア 100 点（最大値）で赤色に色分けされる
  test("優先度スコア100で赤色に色分けされることを確認", () => {
    const maxScoreIssue: IssueSummary = {
      issueId: "issue-max-score-001",
      priorityScore: 100,
      keyword: "critical_system_outage",
      impactLevel: "high",
    };

    const input: PrioritizeAndColorizeIssuesInput = {
      issues: [maxScoreIssue],
      colorThresholds: {
        redThresholdMin: 70,
        yellowThresholdMin: 40,
      },
      requestedBy: "user-dept-head-001",
    };

    const result: ColorizedIssueList = prioritizeAndColorizeIssues(input);

    expect(result.colorizedIssues).toHaveLength(1);
    expect(result.colorizedIssues[0].issueId).toBe("issue-max-score-001");
    expect(result.colorizedIssues[0].priorityScore).toBe(100);
    expect(result.colorizedIssues[0].highlightColor).toBe("red");
    expect(result.colorDistribution.red).toBe(1);
    expect(result.colorDistribution.yellow).toBe(0);
    expect(result.colorDistribution.green).toBe(0);
    expect(typeof result.processedAt).toBe("string");
  });
});