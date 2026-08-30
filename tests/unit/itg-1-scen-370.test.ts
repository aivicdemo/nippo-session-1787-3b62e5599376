import { calculatePriorityScoreForIssue } from "../../src/logic/priority-scoring-engine";

describe("Priority Scoring Engine", () => {
  // SCEN-370
  test("should calculate priority score from frequency and impact, returning HIGH rank with RED color", () => {
    const input = {
      issueId: "ISSUE-001",
      frequency: 50,
      impactScore: 60,
      frequencyWeight: 0.4,
      impactWeight: 0.6,
    };

    const result = calculatePriorityScoreForIssue(input);

    expect(result.issueId).toBe("ISSUE-001");
    expect(result.priorityScore).toBe(56);
    expect(result.priorityRank).toBe("HIGH");
    expect(result.colorCode).toBe("RED");
  });
});