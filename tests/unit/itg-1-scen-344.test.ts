import { calculatePriorityScoreForIssue } from "../../src/logic/priority-scoring-engine";

describe("priority-scoring-engine", () => {
  // SCEN-344
  test("should throw error when priority thresholds are invalid (inverted order)", () => {
    const invalidThresholds = {
      high: 50,
      medium: 70,
      low: 30,
    };

    const issueKeyword = "test-issue";
    const frequencyScore = 50;
    const impactScore = 50;

    expect(() =>
      calculatePriorityScoreForIssue(
        issueKeyword,
        frequencyScore,
        impactScore,
        invalidThresholds
      )
    ).toThrow(/優先度閾値/);
  });
});