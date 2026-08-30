import { calculatePriorityScoreForIssue } from "../../src/logic/priority-scoring-engine";

describe("Priority Scoring Engine", () => {
  // SCEN-232
  test("should normalize impact score to team size upper limit when affected member count exceeds total team members", () => {
    const issueId = "issue-001";
    const frequency = 50;
    const affectedMemberCount = 12;
    const teamSize = 10;
    const frequencyWeight = 0.4;
    const impactWeight = 0.6;

    const result = calculatePriorityScoreForIssue({
      issueId,
      frequency,
      affectedMemberCount,
      teamSize,
      frequencyWeight,
      impactWeight,
    });

    // Impact score should be clamped to 100 (team size upper limit)
    expect(result.impactScore).toBe(100);

    // Priority score = (frequency * frequencyWeight) + (impactScore * impactWeight)
    // = (50 * 0.4) + (100 * 0.6) = 20 + 60 = 80
    expect(result.priorityScore).toBe(80);

    // Priority rank for score 80 should be 'HIGH' (>= 70)
    expect(result.priorityRank).toBe("HIGH");

    // Color code for 'HIGH' rank should be 'RED'
    expect(result.colorCode).toBe("RED");

    // Issue ID should match input
    expect(result.issueId).toBe(issueId);
  });
});