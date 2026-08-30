import { calculatePriorityScoreForIssue } from "../../src/logic/priority-scoring-engine";

describe("Priority Scoring Engine", () => {
  // SCEN-267
  test("should throw InvalidIssueDataError when frequency is negative", () => {
    const input = {
      issueId: "ISSUE-001",
      frequency: -5,
      impactScore: 50,
      frequencyWeight: 0.4,
      impactWeight: 0.6,
    };

    expect(() => calculatePriorityScoreForIssue(input)).toThrow(
      /発生頻度/
    );
  });
});