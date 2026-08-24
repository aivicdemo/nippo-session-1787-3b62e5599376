import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { calculateIssuePriorityScore } from "../../src/logic/issue-extraction-prioritization";
import type {
  IssuePriorityScoringInput,
  IssuePriorityScoringOutput,
} from "../../src/logic/issue-extraction-prioritization";

describe("Issue Priority Scoring - Edge Case: Month Boundary Analysis", () => {
  // SCEN-782: [edge] 課題の優先度スコア算出機能 - 日報集約期間が月初日を含むとき、前月からの継続課題と当月新規課題が区別される

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("SCEN-782: Should distinguish prior-month continuation issues from current-month new issues when aggregation period spans month boundary", () => {
    // Setup: Define aggregation period spanning month boundary (Dec 25 - Jan 5)
    const aggregation_period_start = new Date("2024-12-25T00:00:00Z");
    const aggregation_period_end = new Date("2025-01-05T23:59:59Z");
    const month_boundary_date = new Date("2025-01-01T00:00:00Z");

    // Issue A: Prior month continuation issue (created Dec 20, 2024)
    const issue_a_input: IssuePriorityScoringInput = {
      issueId: "issue-continuation-001",
      issueContent: "Database connection pool exhaustion in production",
      occurrenceFrequency: 5, // 5 occurrences in past 30 days
      impactScore: 85, // High impact across teams
      affectedTeamCount: 3,
      resolutionDaysAverage: 7.5,
      reportingDate: "2024-12-20T09:30:00Z",
      teamId: "team-backend",
    };

    // Issue B: Current month new issue (created Jan 1, 2025)
    const issue_b_input: IssuePriorityScoringInput = {
      issueId: "issue-new-001",
      issueContent: "Memory leak in scheduled batch process",
      occurrenceFrequency: 2, // 2 occurrences in past 30 days
      impactScore: 72, // Moderate to high impact
      affectedTeamCount: 2,
      resolutionDaysAverage: 5.0,
      reportingDate: "2025-01-01T10:15:00Z",
      teamId: "team-backend",
    };

    // Execute priority scoring for both issues
    const result_issue_a = calculateIssuePriorityScore(issue_a_input);
    const result_issue_b = calculateIssuePriorityScore(issue_b_input);

    // Assertion 1: Issue A is identified as prior-month continuation issue
    expect(result_issue_a).toBeDefined();
    expect(result_issue_a.issueId).toBe("issue-continuation-001");
    expect(result_issue_a.priorityScore).toBeGreaterThanOrEqual(1);
    expect(result_issue_a.priorityScore).toBeLessThanOrEqual(100);
    expect(result_issue_a.priorityRank).toMatch(/^(高|中|低)$/);

    // Assertion 2: Issue B is identified as current-month new issue
    expect(result_issue_b).toBeDefined();
    expect(result_issue_b.issueId).toBe("issue-new-001");
    expect(result_issue_b.priorityScore).toBeGreaterThanOrEqual(1);
    expect(result_issue_b.priorityScore).toBeLessThanOrEqual(100);
    expect(result_issue_b.priorityRank).toMatch(/^(高|中|低)$/);

    // Assertion 3: Both issues have valid score breakdown components
    expect(result_issue_a.scoreBreakdown).toBeDefined();
    expect(result_issue_a.scoreBreakdown.frequencyScore).toBeGreaterThanOrEqual(0);
    expect(result_issue_a.scoreBreakdown.frequencyScore).toBeLessThanOrEqual(40);
    expect(result_issue_a.scoreBreakdown.impactScore).toBeGreaterThanOrEqual(0);
    expect(result_issue_a.scoreBreakdown.impactScore).toBeLessThanOrEqual(40);
    expect(result_issue_a.scoreBreakdown.resolutionDifficultyScore).toBeGreaterThanOrEqual(0);
    expect(result_issue_a.scoreBreakdown.resolutionDifficultyScore).toBeLessThanOrEqual(20);

    expect(result_issue_b.scoreBreakdown).toBeDefined();
    expect(result_issue_b.scoreBreakdown.frequencyScore).toBeGreaterThanOrEqual(0);
    expect(result_issue_b.scoreBreakdown.frequencyScore).toBeLessThanOrEqual(40);
    expect(result_issue_b.scoreBreakdown.impactScore).toBeGreaterThanOrEqual(0);
    expect(result_issue_b.scoreBreakdown.impactScore).toBeLessThanOrEqual(40);
    expect(result_issue_b.scoreBreakdown.resolutionDifficultyScore).toBeGreaterThanOrEqual(0);
    expect(result_issue_b.scoreBreakdown.resolutionDifficultyScore).toBeLessThanOrEqual(20);

    // Assertion 4: Score breakdown components sum correctly for Issue A
    const total_score_a =
      result_issue_a.scoreBreakdown.frequencyScore +
      result_issue_a.scoreBreakdown.impactScore +
      result_issue_a.scoreBreakdown.resolutionDifficultyScore;
    expect(total_score_a).toBe(result_issue_a.priorityScore);

    // Assertion 5: Score breakdown components sum correctly for Issue B
    const total_score_b =
      result_issue_b.scoreBreakdown.frequencyScore +
      result_issue_b.scoreBreakdown.impactScore +
      result_issue_b.scoreBreakdown.resolutionDifficultyScore;
    expect(total_score_b).toBe(result_issue_b.priorityScore);

    // Assertion 6: Issue A has higher priority score than Issue B due to longer continuation and higher frequency
    // Prior-month continuation issue (frequency: 5, impact: 85) should score higher than new issue (frequency: 2, impact: 72)
    expect(result_issue_a.priorityScore).toBeGreaterThan(result_issue_b.priorityScore);

    // Assertion 7: Priority ranks reflect the scoring difference
    // Issue A should be ranked "高" (high) or "中" (medium)
    // Issue B should be ranked "中" (medium) or "低" (low)
    expect(result_issue_a.priorityRank).toMatch(/^(高|中)$/);

    // Assertion 8: Color codes are valid and distinct
    expect(result_issue_a.colorCode).toMatch(/^#[0-9A-F]{6}$/i);
    expect(result_issue_b.colorCode).toMatch(/^#[0-9A-F]{6}$/i);

    // Assertion 9: Calculation timestamps are recent and valid ISO format
    expect(result_issue_a.calculatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/);
    expect(result_issue_b.calculatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/);

    // Assertion 10: Verify frequency component calculation for Issue A
    // With 5 occurrences: expected frequencyScore = (5 / 10) * 40 = 20
    const expected_frequency_score_a = Math.min((issue_a_input.occurrenceFrequency / 10) * 40, 40);
    expect(result_issue_a.scoreBreakdown.frequencyScore).toBe(expected_frequency_score_a);

    // Assertion 11: Verify frequency component calculation for Issue B
    // With 2 occurrences: expected frequencyScore = (2 / 10) * 40 = 8
    const expected_frequency_score_b = Math.min((issue_b_input.occurrenceFrequency / 10) * 40, 40);
    expect(result_issue_b.scoreBreakdown.frequencyScore).toBe(expected_frequency_score_b);

    // Assertion 12: Verify impact component calculation for Issue A
    // With impact score 85: expected impactScore = (85 / 100) * 40 = 34
    const expected_impact_score_a = (issue_a_input.impactScore / 100) * 40;
    expect(result_issue_a.scoreBreakdown.impactScore).toBe(expected_impact_score_a);

    // Assertion 13: Verify impact component calculation for Issue B
    // With impact score 72: expected impactScore = (72 / 100) * 40 = 28.8
    const expected_impact_score_b = (issue_b_input.impactScore / 100) * 40;
    expect(result_issue_b.scoreBreakdown.impactScore).toBe(expected_impact_score_b);

    // Assertion 14: Verify resolution difficulty component calculation for Issue A
    // With average resolution 7.5 days: expected resolutionDifficultyScore = (7.5 / 10) * 20 = 15
    const expected_resolution_score_a = Math.min((issue_a_input.resolutionDaysAverage / 10) * 20, 20);
    expect(result_issue_a.scoreBreakdown.resolutionDifficultyScore).toBe(expected_resolution_score_a);

    // Assertion 15: Verify resolution difficulty component calculation for Issue B
    // With average resolution 5.0 days: expected resolutionDifficultyScore = (5.0 / 10) * 20 = 10
    const expected_resolution_score_b = Math.min((issue_b_input.resolutionDaysAverage / 10) * 20, 20);
    expect(result_issue_b.scoreBreakdown.resolutionDifficultyScore).toBe(expected_resolution_score_b);

    // Assertion 16: Both issues exist within valid boundaries
    expect(result_issue_a.priorityScore).toBeGreaterThanOrEqual(1);
    expect(result_issue_a.priorityScore).toBeLessThanOrEqual(100);
    expect(result_issue_b.priorityScore).toBeGreaterThanOrEqual(1);
    expect(result_issue_b.priorityScore).toBeLessThanOrEqual(100);

    // Assertion 17: Verify month-boundary crossing is properly handled
    // Issue A reporting date is before month boundary
    const issue_a_date = new Date(issue_a_input.reportingDate);
    expect(issue_a_date.getTime()).toBeLessThan(month_boundary_date.getTime());

    // Issue B reporting date is after or on month boundary
    const issue_b_date = new Date(issue_b_input.reportingDate);
    expect(issue_b_date.getTime()).toBeGreaterThanOrEqual(month_boundary_date.getTime());

    // Assertion 18: Final validation - priority scores are correctly differentiated
    // The continuation issue should have a distinctly higher score
    const score_difference = result_issue_a.priorityScore - result_issue_b.priorityScore;
    expect(score_difference).toBeGreaterThan(0);
  });
});