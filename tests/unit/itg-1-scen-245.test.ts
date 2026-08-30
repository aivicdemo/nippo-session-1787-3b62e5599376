import { calculatePriorityScoreForIssue } from "../../src/logic/priority-scoring-engine";
import type { IssuePriorityScoringInput } from "../../src/logic/priority-scoring-engine";

describe("Priority Scoring Engine", () => {
  // SCEN-245
  test("should throw OutOfRangeScoreError when impactScore exceeds 100", () => {
    const input: IssuePriorityScoringInput = {
      issueId: "ISSUE-001",
      frequency: 50,
      impactScore: 150,
      frequencyWeight: 0.4,
      impactWeight: 0.6,
    };

    expect(() => calculatePriorityScoreForIssue(input)).toThrow(
      /影響度スコアは0～100の範囲で指定してください/
    );
  });
});