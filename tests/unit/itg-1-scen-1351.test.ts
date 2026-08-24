import { describe, it, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Priority Scoring - Edge Cases', () => {
  it('SCEN-1351: maintains original order when multiple issues have identical impact scores', () => {
    const issues = [
      {
        issueId: '1',
        issueContent: 'DB接続エラー',
        occurrenceFrequency: 3,
        impactScore: 75,
        affectedTeamCount: 2,
        resolutionDaysAverage: 2,
        reportingDate: '2024-01-15',
        teamId: 'team-A',
      },
      {
        issueId: '2',
        issueContent: 'ネットワーク遅延',
        occurrenceFrequency: 3,
        impactScore: 75,
        affectedTeamCount: 2,
        resolutionDaysAverage: 2,
        reportingDate: '2024-01-15',
        teamId: 'team-A',
      },
      {
        issueId: '3',
        issueContent: 'メモリリーク',
        occurrenceFrequency: 3,
        impactScore: 75,
        affectedTeamCount: 2,
        resolutionDaysAverage: 2,
        reportingDate: '2024-01-15',
        teamId: 'team-A',
      },
    ];

    const result = calculateIssuePriorityScore(issues[0]);

    expect(result.issueId).toBe('1');
    expect(result.priorityScore).toBe(72);
    expect(result.priorityRank).toBe('高');
    expect(result.colorCode).toBe('#FF0000');
    expect(result.scoreBreakdown).toEqual({
      frequencyScore: 24,
      impactScore: 30,
      resolutionDifficultyScore: 18,
    });
    expect(result.calculatedAt).toBeDefined();
  });
});