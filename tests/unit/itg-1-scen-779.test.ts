import { describe, test, expect, beforeEach } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput, IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Priority Scoring - Reverse Order Sort', () => {
  test('SCEN-779: Issue priority scores in ascending order are correctly reversed to descending order after sorting', () => {
    const issuePriorityScoringInputs: IssuePriorityScoringInput[] = [
      {
        issueId: 'issue-1',
        issueContent: 'API response timeout',
        occurrenceFrequency: 2,
        impactScore: 20,
        affectedTeamCount: 1,
        resolutionDaysAverage: 1,
        reportingDate: '2024-01-15',
        teamId: 'team-alpha',
      },
      {
        issueId: 'issue-2',
        issueContent: 'Database connection pool exhaustion',
        occurrenceFrequency: 4,
        impactScore: 40,
        affectedTeamCount: 2,
        resolutionDaysAverage: 2,
        reportingDate: '2024-01-15',
        teamId: 'team-alpha',
      },
      {
        issueId: 'issue-3',
        issueContent: 'Memory leak in cache layer',
        occurrenceFrequency: 6,
        impactScore: 60,
        affectedTeamCount: 3,
        resolutionDaysAverage: 3,
        reportingDate: '2024-01-15',
        teamId: 'team-alpha',
      },
      {
        issueId: 'issue-4',
        issueContent: 'Concurrent request handling failure',
        occurrenceFrequency: 8,
        impactScore: 80,
        affectedTeamCount: 4,
        resolutionDaysAverage: 4,
        reportingDate: '2024-01-15',
        teamId: 'team-alpha',
      },
      {
        issueId: 'issue-5',
        issueContent: 'Critical production incident - system unavailable',
        occurrenceFrequency: 10,
        impactScore: 100,
        affectedTeamCount: 5,
        resolutionDaysAverage: 5,
        reportingDate: '2024-01-15',
        teamId: 'team-alpha',
      },
    ];

    const sortedResults: IssuePriorityScoringOutput[] = issuePriorityScoringInputs
      .map(input => calculateIssuePriorityScore(input))
      .sort((a, b) => b.priorityScore - a.priorityScore);

    expect(sortedResults).toHaveLength(5);

    expect(sortedResults[0].priorityScore).toBe(100);
    expect(sortedResults[0].issueId).toBe('issue-5');
    expect(sortedResults[0].priorityRank).toBe('高');

    expect(sortedResults[1].priorityScore).toBe(80);
    expect(sortedResults[1].issueId).toBe('issue-4');
    expect(sortedResults[1].priorityRank).toBe('高');

    expect(sortedResults[2].priorityScore).toBe(60);
    expect(sortedResults[2].issueId).toBe('issue-3');
    expect(sortedResults[2].priorityRank).toBe('中');

    expect(sortedResults[3].priorityScore).toBe(40);
    expect(sortedResults[3].issueId).toBe('issue-2');
    expect(sortedResults[3].priorityRank).toBe('中');

    expect(sortedResults[4].priorityScore).toBe(20);
    expect(sortedResults[4].issueId).toBe('issue-1');
    expect(sortedResults[4].priorityRank).toBe('低');

    sortedResults.forEach((result, index) => {
      expect(result.calculatedAt).toBeDefined();
      expect(result.scoreBreakdown).toBeDefined();
      expect(result.scoreBreakdown.frequencyScore).toBeGreaterThanOrEqual(0);
      expect(result.scoreBreakdown.frequencyScore).toBeLessThanOrEqual(40);
      expect(result.scoreBreakdown.impactScore).toBeGreaterThanOrEqual(0);
      expect(result.scoreBreakdown.impactScore).toBeLessThanOrEqual(40);
      expect(result.scoreBreakdown.resolutionDifficultyScore).toBeGreaterThanOrEqual(0);
      expect(result.scoreBreakdown.resolutionDifficultyScore).toBeLessThanOrEqual(20);
    });

    const priorityScores = sortedResults.map(r => r.priorityScore);
    for (let i = 0; i < priorityScores.length - 1; i++) {
      expect(priorityScores[i]).toBeGreaterThanOrEqual(priorityScores[i + 1]);
    }
  });
});