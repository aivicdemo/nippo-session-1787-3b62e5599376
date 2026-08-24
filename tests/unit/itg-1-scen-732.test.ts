import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { prioritizeAndColorizeIssues } from "../../src/logic/issue-extraction-prioritization";
import type {
  PrioritizeAndColorizeIssuesInput,
  ColorizedIssueList,
  IssueSummary,
  ColorThresholdConfig,
} from "../../src/logic/issue-extraction-prioritization";

describe("prioritizeAndColorizeIssues - dashboard color consistency for duplicate issues", () => {
  // SCEN-732
  test("should apply identical color to all duplicate issues in dashboard display", () => {
    const duplicateIssueId = "ISSUE-001";
    const duplicateKeyword = "API統合エラー";

    const issue1: IssueSummary = {
      issueId: duplicateIssueId,
      priorityScore: 75,
      keyword: duplicateKeyword,
      impactLevel: "high",
    };

    const issue2: IssueSummary = {
      issueId: duplicateIssueId,
      priorityScore: 75,
      keyword: duplicateKeyword,
      impactLevel: "high",
    };

    const issue3: IssueSummary = {
      issueId: duplicateIssueId,
      priorityScore: 75,
      keyword: duplicateKeyword,
      impactLevel: "high",
    };

    const colorThresholds: ColorThresholdConfig = {
      redThresholdMin: 70,
      yellowThresholdMin: 40,
    };

    const input: PrioritizeAndColorizeIssuesInput = {
      issues: [issue1, issue2, issue3],
      colorThresholds: colorThresholds,
      requestedBy: "user-dept-chief-001",
    };

    const result: ColorizedIssueList = prioritizeAndColorizeIssues(input);

    expect(result.colorizedIssues).toHaveLength(3);

    const color1 = result.colorizedIssues[0].highlightColor;
    const color2 = result.colorizedIssues[1].highlightColor;
    const color3 = result.colorizedIssues[2].highlightColor;

    expect(color1).toBe(color2);
    expect(color2).toBe(color3);
    expect(color1).toBe("red");

    expect(result.colorDistribution.red).toBe(3);
    expect(result.colorDistribution.yellow).toBe(0);
    expect(result.colorDistribution.green).toBe(0);

    for (const colorizedIssue of result.colorizedIssues) {
      expect(colorizedIssue.issueId).toBe(duplicateIssueId);
      expect(colorizedIssue.keyword).toBe(duplicateKeyword);
      expect(colorizedIssue.priorityScore).toBe(75);
      expect(colorizedIssue.highlightColor).toBe("red");
    }
  });
});