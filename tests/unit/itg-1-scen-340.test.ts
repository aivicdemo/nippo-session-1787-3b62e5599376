import { describe, test, expect, jest } from "@jest/globals";
import { calculatePriorityScoreForIssue } from "../../src/logic/priority-scoring-engine";

describe("Priority Scoring Engine", () => {
  test("SCEN-340: Should normalize impact score to maximum 100% when affected member count exceeds team size", () => {
    const result = calculatePriorityScoreForIssue({
      issueId: "ISSUE-001",
      frequency: 50,
      impactScore: 100,
      frequencyWeight: 0.4,
      impactWeight: 0.6,
    });

    expect(result).toEqual({
      issueId: "ISSUE-001",
      priorityScore: 100,
      priorityRank: "HIGH",
      colorCode: "RED",
    });
  });
});