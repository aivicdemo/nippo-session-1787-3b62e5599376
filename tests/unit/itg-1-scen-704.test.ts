import { describe, test, expect } from "@jest/globals";
import { prioritizeAndColorizeIssues } from "../../src/logic/issue-extraction-prioritization";
import type {
  PrioritizeAndColorizeIssuesInput,
  ColorizedIssueList,
} from "../../src/logic/issue-extraction-prioritization";

describe("prioritizeAndColorizeIssues - error handling for null issues list", () => {
  // SCEN-704
  test("should throw error when issues array is null and handle gracefully", () => {
    const input: PrioritizeAndColorizeIssuesInput = {
      issues: null as any,
      colorThresholds: {
        redThresholdMin: 70,
        yellowThresholdMin: 40,
      },
      requestedBy: "user-001",
    };

    expect(() => {
      prioritizeAndColorizeIssues(input);
    }).toThrow(/課題リスト|null|undefined|定義/);
  });
});