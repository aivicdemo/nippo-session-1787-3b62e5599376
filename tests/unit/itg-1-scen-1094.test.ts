import { describe, test, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput, IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Priority Scoring - Edge Cases', () => {
  // SCEN-1094
  test('should maintain consistent ordering when multiple issues have identical priority scores across repeated executions', () => {
    const issueA: IssuePriorityScoringInput = {
      issueId: 'issue-a-001',
      issueContent: 'Database connection timeout on production',
      occurrenceFrequency: 5,
      impactScore: 85,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2.5,
      reportingDate: '2024-01-15',
      teamId: 'team-001',
    };

    const issueB: IssuePriorityScoringInput = {
      issueId: 'issue-b-002',
      issueContent: 'Memory leak in cache layer',
      occurrenceFrequency: 5,
      impactScore: 85,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2.5,
      reportingDate: '2024-01-15',
      teamId: 'team-001',
    };

    const issueC: IssuePriorityScoringInput = {
      issueId: 'issue-c-003',
      issueContent: 'API response time degradation',
      occurrenceFrequency: 5,
      impactScore: 85,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2.5,
      reportingDate: '2024-01-15',
      teamId: 'team-001',
    };

    const issueD: IssuePriorityScoringInput = {
      issueId: 'issue-d-004',
      issueContent: 'Minor UI alignment issue',
      occurrenceFrequency: 2,
      impactScore: 20,
      affectedTeamCount: 1,
      resolutionDaysAverage: 0.5,
      reportingDate: '2024-01-15',
      teamId: 'team-001',
    };

    const inputs = [issueA, issueB, issueC, issueD];

    const orderingsAcrossRuns: string[][] = [];

    for (let runIndex = 0; runIndex < 5; runIndex++) {
      const results: IssuePriorityScoringOutput[] = inputs.map((input) =>
        calculateIssuePriorityScore(input)
      );

      const scoreToIssueIds: Map<number, string[]> = new Map();
      for (const result of results) {
        const score = result.priorityScore;
        if (!scoreToIssueIds.has(score)) {
          scoreToIssueIds.set(score, []);
        }
        scoreToIssueIds.get(score)!.push(result.issueId);
      }

      const sortedScores = Array.from(scoreToIssueIds.keys()).sort((a, b) => b - a);
      const highScoreGroup = scoreToIssueIds.get(sortedScores[0]) || [];
      const lowScoreGroup = scoreToIssueIds.get(sortedScores[sortedScores.length - 1]) || [];

      orderingsAcrossRuns.push([...highScoreGroup]);

      if (runIndex === 0) {
        expect(highScoreGroup).toHaveLength(3);
        expect(highScoreGroup).toContain('issue-a-001');
        expect(highScoreGroup).toContain('issue-b-002');
        expect(highScoreGroup).toContain('issue-c-003');

        expect(lowScoreGroup).toHaveLength(1);
        expect(lowScoreGroup).toContain('issue-d-004');

        expect(results[3].priorityScore).toBeLessThan(results[0].priorityScore);
      }
    }

    for (let i = 1; i < orderingsAcrossRuns.length; i++) {
      expect(orderingsAcrossRuns[i]).toEqual(orderingsAcrossRuns[0]);
    }

    const firstRunOrdering = orderingsAcrossRuns[0];
    const repeatedOrdering = orderingsAcrossRuns[4];
    expect(repeatedOrdering).toEqual(firstRunOrdering);
  });
});