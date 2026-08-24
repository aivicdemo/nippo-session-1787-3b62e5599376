import { describe, test, expect } from "@jest/globals";
import { prioritizeAndColorizeIssues } from "../../src/logic/issue-extraction-prioritization";
import type { PrioritizeAndColorizeIssuesInput, ColorizedIssueList } from "../../src/logic/issue-extraction-prioritization";

describe("prioritizeAndColorizeIssues", () => {
  // SCEN-726: [edge] 課題優先度スコアによるダッシュボード強調表示機能 - 優先度スコアが閾値直下（例：69.9）の課題をハイライト表示しない
  test("should not highlight issues with priority score below threshold (69.9 when threshold is 70)", () => {
    const input: PrioritizeAndColorizeIssuesInput = {
      issues: [
        {
          issueId: "issue-001",
          priorityScore: 69.9,
          keyword: "Database performance degradation",
          impactLevel: "high",
        },
        {
          issueId: "issue-002",
          priorityScore: 70.0,
          keyword: "API timeout errors",
          impactLevel: "high",
        },
        {
          issueId: "issue-003",
          priorityScore: 35.5,
          keyword: "Minor documentation update needed",
          impactLevel: "low",
        },
      ],
      colorThresholds: {
        redThresholdMin: 70,
        yellowThresholdMin: 40,
      },
      requestedBy: "user-director-001",
    };

    const result: ColorizedIssueList = prioritizeAndColorizeIssues(input);

    expect(result).toBeDefined();
    expect(result.colorizedIssues).toHaveLength(3);

    const issue001 = result.colorizedIssues.find((i) => i.issueId === "issue-001");
    expect(issue001).toBeDefined();
    expect(issue001?.shouldHighlight).toBe(false);
    expect(issue001?.highlightColor).toBe("none");

    const issue002 = result.colorizedIssues.find((i) => i.issueId === "issue-002");
    expect(issue002).toBeDefined();
    expect(issue002?.shouldHighlight).toBe(true);
    expect(issue002?.highlightColor).toBe("red");

    const issue003 = result.colorizedIssues.find((i) => i.issueId === "issue-003");
    expect(issue003).toBeDefined();
    expect(issue003?.shouldHighlight).toBe(false);
    expect(issue003?.highlightColor).toBe("green");

    expect(result.colorDistribution.red).toBe(1);
    expect(result.colorDistribution.yellow).toBe(0);
    expect(result.colorDistribution.green).toBe(1);

    expect(result.processedAt).toBeDefined();
    const processedDate = new Date(result.processedAt);
    expect(processedDate.getTime()).toBeGreaterThan(0);
  });
});