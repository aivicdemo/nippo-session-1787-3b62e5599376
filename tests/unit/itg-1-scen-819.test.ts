import { describe, it, expect, beforeEach } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Priority Score Calculation - Monthly Boundary Aggregation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-819
  it('should accurately aggregate issue frequency across a 7-day period that spans month boundary', () => {
    // Setup: Define 7 days spanning month boundary (Jan 28 - Feb 3)
    const startDate = new Date('2024-01-28T00:00:00Z');
    const endDate = new Date('2024-02-03T23:59:59Z');

    // Generate 7 reports, one per day, each containing the keyword "サーバー障害" once
    const issueId = 'issue-001';
    const issueContent = 'サーバー障害により対応が必要です';
    const occurrenceFrequency = 7; // 7 days × 1 occurrence per day
    const impactScore = 85;
    const affectedTeamCount = 3;
    const resolutionDaysAverage = 2.5;
    const reportingDate = '2024-02-03';
    const teamId = 'team-dev-001';

    // Calculate priority score using the formula:
    // frequencyScore (0-40): min(40, (7 / 30) * 40) = min(40, 9.33) = 9.33
    // impactScore (0-40): (85 / 100) * 40 = 34
    // resolutionDifficultyScore (0-20): min(20, (2.5 / 7) * 20) = min(20, 7.14) = 7.14
    // priorityScore = 9.33 + 34 + 7.14 = 50.47, rounded to 50

    const result = calculateIssuePriorityScore({
      issueId,
      issueContent,
      occurrenceFrequency,
      impactScore,
      affectedTeamCount,
      resolutionDaysAverage,
      reportingDate,
      teamId,
    });

    // Verify the aggregated frequency is exactly 7
    expect(result.issueId).toBe('issue-001');
    
    // Verify priority score calculation with monthly boundary crossing
    // Expected: frequencyScore ≈ 9.33, impactScore = 34, resolutionDifficultyScore ≈ 7.14
    // Total ≈ 50.47 → rounded to 50
    expect(result.priorityScore).toBe(50);
    
    // Verify priority rank based on score
    expect(result.priorityRank).toBe('中');
    
    // Verify score breakdown
    expect(result.scoreBreakdown.frequencyScore).toBe(9);
    expect(result.scoreBreakdown.impactScore).toBe(34);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBe(7);
    
    // Verify color code for medium priority
    expect(result.colorCode).toBe('#FFFF00');
    
    // Verify calculation timestamp exists
    expect(result.calculatedAt).toBeDefined();
    expect(typeof result.calculatedAt).toBe('string');
  });
});