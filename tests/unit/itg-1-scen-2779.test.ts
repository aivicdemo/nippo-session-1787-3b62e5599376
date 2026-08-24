import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Priority Scoring - Edge Case: Zero Priority Score', () => {
  test('SCEN-2779: Zero priority score is displayed with low priority color', () => {
    const input = {
      issueId: 'issue-zero-score',
      issueContent: 'Minor documentation typo',
      occurrenceFrequency: 0,
      impactScore: 0,
      affectedTeamCount: 0,
      resolutionDaysAverage: 0.5,
      reportingDate: '2024-01-15T09:00:00Z',
      teamId: 'team-001',
    };

    const result = calculateIssuePriorityScore(input);

    expect(result.issueId).toBe('issue-zero-score');
    expect(result.priorityScore).toBe(0);
    expect(result.priorityRank).toBe('低');
    expect(result.colorCode).toBe('#D3D3D3');
    expect(result.scoreBreakdown.frequencyScore).toBe(0);
    expect(result.scoreBreakdown.impactScore).toBe(0);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBe(0);
  });
});