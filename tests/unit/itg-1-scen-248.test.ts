import { calculatePriorityScoreForIssue } from "../../src/logic/priority-scoring-engine";

describe("Priority Scoring Engine - calculatePriorityScoreForIssue", () => {
  // SCEN-248
  test("should throw InvalidIssueDataError when frequency is negative", () => {
    const invalidInput = {
      issueId: "ISSUE-001",
      frequency: -5,
      impactScore: 50,
      frequencyWeight: 0.4,
      impactWeight: 0.6,
    };

    expect(() => calculatePriorityScoreForIssue(invalidInput)).toThrow(
      /発生頻度/
    );
  });
});