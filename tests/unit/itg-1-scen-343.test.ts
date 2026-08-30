import { calculatePriorityScoreForIssue } from "../../src/logic/priority-scoring-engine";
import type { IssuePriorityScoringInput, IssuePriorityScore } from "../../src/logic/priority-scoring-engine";

describe("Priority Scoring Engine - Edge Case Normalization", () => {
  test("SCEN-343: priorityScore should be normalized to 0-100 range when input values exceed boundaries", () => {
    // Test case 1: impactScore < 0 should be clamped to 0
    const input1: IssuePriorityScoringInput = {
      issueId: "ISSUE-001",
      frequency: 50,
      impactScore: -5,
      frequencyWeight: 0.4,
      impactWeight: 0.6,
    };
    const result1: IssuePriorityScore = calculatePriorityScoreForIssue(input1);
    // Expected: impactScore normalized to 0, priorityScore = 50 * 0.4 + 0 * 0.6 = 20
    expect(result1.issueId).toBe("ISSUE-001");
    expect(result1.priorityScore).toBe(20);
    expect(result1.priorityScore).toBeGreaterThanOrEqual(0);
    expect(result1.priorityScore).toBeLessThanOrEqual(100);

    // Test case 2: impactScore > 100 should be clamped to 100
    const input2: IssuePriorityScoringInput = {
      issueId: "ISSUE-002",
      frequency: 50,
      impactScore: 105,
      frequencyWeight: 0.4,
      impactWeight: 0.6,
    };
    const result2: IssuePriorityScore = calculatePriorityScoreForIssue(input2);
    // Expected: impactScore normalized to 100, priorityScore = 50 * 0.4 + 100 * 0.6 = 80
    expect(result2.issueId).toBe("ISSUE-002");
    expect(result2.priorityScore).toBe(80);
    expect(result2.priorityScore).toBeGreaterThanOrEqual(0);
    expect(result2.priorityScore).toBeLessThanOrEqual(100);

    // Test case 3: frequency < 0 should be clamped to 0
    const input3: IssuePriorityScoringInput = {
      issueId: "ISSUE-003",
      frequency: -10,
      impactScore: 50,
      frequencyWeight: 0.4,
      impactWeight: 0.6,
    };
    const result3: IssuePriorityScore = calculatePriorityScoreForIssue(input3);
    // Expected: frequency normalized to 0, priorityScore = 0 * 0.4 + 50 * 0.6 = 30
    expect(result3.issueId).toBe("ISSUE-003");
    expect(result3.priorityScore).toBe(30);
    expect(result3.priorityScore).toBeGreaterThanOrEqual(0);
    expect(result3.priorityScore).toBeLessThanOrEqual(100);

    // Test case 4: frequency > 100 should be clamped to 100
    const input4: IssuePriorityScoringInput = {
      issueId: "ISSUE-004",
      frequency: 110,
      impactScore: 50,
      frequencyWeight: 0.4,
      impactWeight: 0.6,
    };
    const result4: IssuePriorityScore = calculatePriorityScoreForIssue(input4);
    // Expected: frequency normalized to 100, priorityScore = 100 * 0.4 + 50 * 0.6 = 70
    expect(result4.issueId).toBe("ISSUE-004");
    expect(result4.priorityScore).toBe(70);
    expect(result4.priorityScore).toBeGreaterThanOrEqual(0);
    expect(result4.priorityScore).toBeLessThanOrEqual(100);
  });
});