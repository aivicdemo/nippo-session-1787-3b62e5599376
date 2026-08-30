import { calculatePriorityScoreForIssue } from "../../src/logic/priority-scoring-engine";

describe("Priority Scoring Engine", () => {
  test("SCEN-264: should throw InvalidIssueDataError when frequency is negative", () => {
    const input = {
      issueId: "ISSUE-001",
      frequency: -5,
      impactScore: 50,
    };

    expect(() => calculatePriorityScoreForIssue(input)).toThrow(/課題データが不完全です。発生頻度と影響度スコアが必須です。/);
  });
});