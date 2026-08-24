import { describe, it, expect, beforeEach } from "@jest/globals";
import { prioritizeAndColorizeIssues } from "../../src/logic/issue-extraction-prioritization";
import type {
  PrioritizeAndColorizeIssuesInput,
  ColorizedIssueList,
  IssueSummary,
  ColorThresholdConfig,
} from "../../src/logic/issue-extraction-prioritization";

describe("prioritizeAndColorizeIssues - Idempotent color display on repeated execution", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("SCEN-1315: should return identical color categorization results when the same input is processed twice", () => {
    const fixedIssues: IssueSummary[] = [
      {
        issueId: "issue-001",
        priorityScore: 75,
        keyword: "APIレスポンス遅延",
        impactLevel: "high",
      },
      {
        issueId: "issue-002",
        priorityScore: 45,
        keyword: "テストカバレッジ不足",
        impactLevel: "medium",
      },
      {
        issueId: "issue-003",
        priorityScore: 25,
        keyword: "ドキュメント更新遅延",
        impactLevel: "low",
      },
    ];

    const colorThresholds: ColorThresholdConfig = {
      redThresholdMin: 70,
      yellowThresholdMin: 40,
    };

    const requestedBy = "user-001";

    const input: PrioritizeAndColorizeIssuesInput = {
      issues: fixedIssues,
      colorThresholds: colorThresholds,
      requestedBy: requestedBy,
    };

    const firstResult: ColorizedIssueList = prioritizeAndColorizeIssues(input);

    const secondResult: ColorizedIssueList = prioritizeAndColorizeIssues(input);

    expect(firstResult.colorizedIssues).toHaveLength(3);
    expect(secondResult.colorizedIssues).toHaveLength(3);

    expect(firstResult.colorizedIssues[0].issueId).toBe("issue-001");
    expect(firstResult.colorizedIssues[0].highlightColor).toBe("red");
    expect(secondResult.colorizedIssues[0].issueId).toBe("issue-001");
    expect(secondResult.colorizedIssues[0].highlightColor).toBe("red");

    expect(firstResult.colorizedIssues[1].issueId).toBe("issue-002");
    expect(firstResult.colorizedIssues[1].highlightColor).toBe("yellow");
    expect(secondResult.colorizedIssues[1].issueId).toBe("issue-002");
    expect(secondResult.colorizedIssues[1].highlightColor).toBe("yellow");

    expect(firstResult.colorizedIssues[2].issueId).toBe("issue-003");
    expect(firstResult.colorizedIssues[2].highlightColor).toBe("green");
    expect(secondResult.colorizedIssues[2].issueId).toBe("issue-003");
    expect(secondResult.colorizedIssues[2].highlightColor).toBe("green");

    expect(firstResult.colorDistribution.red).toBe(1);
    expect(firstResult.colorDistribution.yellow).toBe(1);
    expect(firstResult.colorDistribution.green).toBe(1);

    expect(secondResult.colorDistribution.red).toBe(1);
    expect(secondResult.colorDistribution.yellow).toBe(1);
    expect(secondResult.colorDistribution.green).toBe(1);

    expect(firstResult.colorDistribution).toEqual(
      secondResult.colorDistribution
    );

    expect(firstResult.colorizedIssues).toEqual(secondResult.colorizedIssues);

    const firstProcessedAt = new Date(firstResult.processedAt);
    const secondProcessedAt = new Date(secondResult.processedAt);
    expect(firstProcessedAt.getTime()).toBeLessThanOrEqual(
      secondProcessedAt.getTime()
    );
  });
});