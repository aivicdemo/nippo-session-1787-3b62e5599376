import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Priority Score Calculation', () => {
  // SCEN-813: [edge] 課題優先度スコア算出機能 - 過去7日間の発生頻度が0回未満（負数）の入力が渡されたとき、0として扱われる
  test('should treat negative occurrence frequency as 0 when calculating priority score', () => {
    const input: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'Database connection timeout',
      occurrenceFrequency: -5,
      impactScore: 75,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15T09:00:00Z',
      teamId: 'team-engineering',
    };

    const result = calculateIssuePriorityScore(input);

    const frequencyScoreWithNegative = 0;
    const impactScoreComponent = (75 / 100) * 40;
    const resolutionDifficultyScore = Math.min((3 / 5) * 20, 20);
    const expectedPriorityScore = frequencyScoreWithNegative + impactScoreComponent + resolutionDifficultyScore;

    expect(result.issueId).toBe('issue-001');
    expect(result.priorityScore).toBe(expectedPriorityScore);
    expect(result.scoreBreakdown.frequencyScore).toBe(0);
    expect(result.scoreBreakdown.impactScore).toBe(impactScoreComponent);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBe(resolutionDifficultyScore);
    expect(result.priorityRank).toBe('中');
    expect(result.colorCode).toBe('#FFFF00');
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