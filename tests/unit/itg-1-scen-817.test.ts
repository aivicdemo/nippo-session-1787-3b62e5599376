import { describe, it, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Priority Scoring - Impact Score Zero Edge Case', () => {
  it('SCEN-817: チーム波及度スコアが0のとき、最小優先度として扱われる', () => {
    // Setup: Base issue data that will be reused for multiple test cases
    const baseIssueData = {
      issueId: 'issue-zero-impact',
      issueContent: 'Database connection timeout during peak hours',
      occurrenceFrequency: 10,
      impactScore: 0, // Zero impact score - the edge case
      affectedTeamCount: 1,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15T09:00:00Z',
      teamId: 'team-engineering'
    };

    // Calculate priority score with impact score = 0
    const priorityScoreZeroImpact = calculateIssuePriorityScore(baseIssueData);

    // Verify the result has expected structure
    expect(priorityScoreZeroImpact).toHaveProperty('issueId');
    expect(priorityScoreZeroImpact).toHaveProperty('priorityScore');
    expect(priorityScoreZeroImpact).toHaveProperty('priorityRank');
    expect(priorityScoreZeroImpact).toHaveProperty('scoreBreakdown');

    // Store the zero-impact priority score for comparison
    const zeroImpactPriorityScore = priorityScoreZeroImpact.priorityScore;

    // Test multiple comparison scenarios with higher impact scores
    const comparisonTestCases = [
      {
        impactScore: 1,
        occurrenceFrequency: 10,
        affectedTeamCount: 1,
        resolutionDaysAverage: 2
      },
      {
        impactScore: 25,
        occurrenceFrequency: 5,
        affectedTeamCount: 2,
        resolutionDaysAverage: 1
      },
      {
        impactScore: 50,
        occurrenceFrequency: 3,
        affectedTeamCount: 1,
        resolutionDaysAverage: 3
      },
      {
        impactScore: 100,
        occurrenceFrequency: 1,
        affectedTeamCount: 5,
        resolutionDaysAverage: 4
      }
    ];

    // Calculate priority scores for comparison cases
    const comparisonScores = comparisonTestCases.map((testCase) => {
      const issueData = {
        issueId: `issue-impact-${testCase.impactScore}`,
        issueContent: 'Database connection timeout during peak hours',
        occurrenceFrequency: testCase.occurrenceFrequency,
        impactScore: testCase.impactScore,
        affectedTeamCount: testCase.affectedTeamCount,
        resolutionDaysAverage: testCase.resolutionDaysAverage,
        reportingDate: '2024-01-15T09:00:00Z',
        teamId: 'team-engineering'
      };
      const result = calculateIssuePriorityScore(issueData);
      return {
        impactScore: testCase.impactScore,
        priorityScore: result.priorityScore
      };
    });

    // Verify zero-impact priority score is lower than all higher-impact scores
    comparisonScores.forEach((comparisonCase) => {
      expect(zeroImpactPriorityScore).toBeLessThan(comparisonCase.priorityScore);
    });

    // Verify zero-impact score is within minimum priority threshold
    // When impact score is 0, even with high frequency, score should remain below 50
    expect(zeroImpactPriorityScore).toBeLessThan(50);

    // Verify the rank reflects minimum priority
    expect(priorityScoreZeroImpact.priorityRank).toBe('低');

    // Verify score breakdown shows zero impact contribution
    expect(priorityScoreZeroImpact.scoreBreakdown.impactScore).toBe(0);

    // Verify color code indicates low priority
    expect(priorityScoreZeroImpact.colorCode).toBe('#00FF00');
  });
});