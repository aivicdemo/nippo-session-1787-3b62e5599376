import { describe, test, expect, beforeEach } from "@jest/globals";
import { calculateIssuePriorityScore } from "../../src/logic/issue-extraction-prioritization";
import type {
  IssuePriorityScoringInput,
  IssuePriorityScoringOutput,
} from "../../src/logic/issue-extraction-prioritization";

describe("Issue Priority Scoring - Impact Score Influence", () => {
  // SCEN-1125
  test("should calculate higher priority score for issues with higher impact scores", () => {
    const mockAssessImpactScore = (
      _issueContent: string,
      _teamId: string
    ): number => {
      // This will be overridden per test case
      return 50;
    };

    // Issue A: High impact score (80)
    const issueA_input: IssuePriorityScoringInput = {
      issueId: "issue-a-001",
      issueContent: "Critical database connectivity failure affecting all services",
      occurrenceFrequency: 5,
      impactScore: 80,
      affectedTeamCount: 4,
      resolutionDaysAverage: 2,
      reportingDate: "2024-01-15",
      teamId: "team-engineering-001",
    };

    // Issue B: Medium impact score (50)
    const issueB_input: IssuePriorityScoringInput = {
      issueId: "issue-b-001",
      issueContent: "Occasional UI rendering delay in dashboard",
      occurrenceFrequency: 3,
      impactScore: 50,
      affectedTeamCount: 2,
      resolutionDaysAverage: 1,
      reportingDate: "2024-01-15",
      teamId: "team-engineering-001",
    };

    // Issue C: Low impact score (20)
    const issueC_input: IssuePriorityScoringInput = {
      issueId: "issue-c-001",
      issueContent: "Minor documentation formatting inconsistency",
      occurrenceFrequency: 1,
      impactScore: 20,
      affectedTeamCount: 1,
      resolutionDaysAverage: 0.5,
      reportingDate: "2024-01-15",
      teamId: "team-engineering-001",
    };

    // Calculate priority scores for all three issues
    const scoreA: IssuePriorityScoringOutput = calculateIssuePriorityScore(
      issueA_input
    );
    const scoreB: IssuePriorityScoringOutput = calculateIssuePriorityScore(
      issueB_input
    );
    const scoreC: IssuePriorityScoringOutput = calculateIssuePriorityScore(
      issueC_input
    );

    // Verify that priority scores follow the impact score hierarchy
    expect(scoreA.priorityScore).toBeGreaterThan(scoreB.priorityScore);
    expect(scoreB.priorityScore).toBeGreaterThan(scoreC.priorityScore);

    // Verify that the relationship holds: A > B > C
    expect(scoreA.priorityScore).toBeGreaterThan(scoreC.priorityScore);

    // Verify that all scores are within valid range (1-100)
    expect(scoreA.priorityScore).toBeGreaterThanOrEqual(1);
    expect(scoreA.priorityScore).toBeLessThanOrEqual(100);
    expect(scoreB.priorityScore).toBeGreaterThanOrEqual(1);
    expect(scoreB.priorityScore).toBeLessThanOrEqual(100);
    expect(scoreC.priorityScore).toBeGreaterThanOrEqual(1);
    expect(scoreC.priorityScore).toBeLessThanOrEqual(100);

    // Verify priority ranks are correctly assigned based on scores
    expect(scoreA.priorityRank).toBe("高");
    expect(scoreC.priorityRank).toBe("低");

    // Verify score breakdown structure exists for each issue
    expect(scoreA.scoreBreakdown).toHaveProperty("frequencyScore");
    expect(scoreA.scoreBreakdown).toHaveProperty("impactScore");
    expect(scoreA.scoreBreakdown).toHaveProperty("resolutionDifficultyScore");
    expect(scoreB.scoreBreakdown).toHaveProperty("frequencyScore");
    expect(scoreB.scoreBreakdown).toHaveProperty("impactScore");
    expect(scoreB.scoreBreakdown).toHaveProperty("resolutionDifficultyScore");
    expect(scoreC.scoreBreakdown).toHaveProperty("frequencyScore");
    expect(scoreC.scoreBreakdown).toHaveProperty("impactScore");
    expect(scoreC.scoreBreakdown).toHaveProperty("resolutionDifficultyScore");

    // Verify impact score component contribution
    expect(scoreA.scoreBreakdown.impactScore).toBeGreaterThan(
      scoreB.scoreBreakdown.impactScore
    );
    expect(scoreB.scoreBreakdown.impactScore).toBeGreaterThan(
      scoreC.scoreBreakdown.impactScore
    );

    // Verify color codes match priority ranks
    expect(scoreA.colorCode).toBe("#FF0000");
    expect(scoreC.colorCode).toBe("#00FF00");

    // Verify calculatedAt timestamp is present and valid
    expect(scoreA.calculatedAt).toBeDefined();
    expect(scoreB.calculatedAt).toBeDefined();
    expect(scoreC.calculatedAt).toBeDefined();

    // Verify issue IDs are preserved
    expect(scoreA.issueId).toBe("issue-a-001");
    expect(scoreB.issueId).toBe("issue-b-001");
    expect(scoreC.issueId).toBe("issue-c-001");
  });
});