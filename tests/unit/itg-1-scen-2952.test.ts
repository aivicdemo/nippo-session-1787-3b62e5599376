import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度スコア算出機能', () => {
  // SCEN-2952
  test('発生頻度が高く波及度が低い課題は中程度スコアが算出される', () => {
    const input: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'Database connection timeout on production server',
      occurrenceFrequency: 70,
      impactScore: 25,
      affectedTeamCount: 2,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: 'team-alpha',
    };

    const result = calculateIssuePriorityScore(input);

    expect(result.issueId).toBe('issue-001');
    expect(result.priorityScore).toBeGreaterThanOrEqual(40);
    expect(result.priorityScore).toBeLessThanOrEqual(60);
    expect(result.priorityRank).toBe('中');
    expect(result.scoreBreakdown.frequencyScore).toBe(28);
    expect(result.scoreBreakdown.impactScore).toBe(10);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBe(4);
    expect(result.colorCode).toBe('#FFFF00');
    expect(result.calculatedAt).toBeDefined();
  });
});

interface IssuePriorityScoringInput {
  issueId: string;
  issueContent: string;
  occurrenceFrequency: number;
  impactScore: number;
  affectedTeamCount: number;
  resolutionDaysAverage: number;
  reportingDate: string;
  teamId: string;
}