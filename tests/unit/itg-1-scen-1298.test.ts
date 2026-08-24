import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput, IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定機能', () => {
  // SCEN-1298: [normal] 課題影響度判定機能 - 波及度スコア0で影響度が最低と判定される
  test('波及度スコア0の課題は影響度レベルが最低と判定される', () => {
    const input: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'テスト課題',
      occurrenceFrequency: 1,
      impactScore: 0,
      affectedTeamCount: 1,
      resolutionDaysAverage: 1,
      reportingDate: '2024-01-15',
      teamId: 'team-001',
    };

    const result: IssuePriorityScoringOutput = calculateIssuePriorityScore(input);

    expect(result.issueId).toBe('issue-001');
    expect(result.priorityScore).toBe(1);
    expect(result.priorityRank).toBe('低');
    expect(result.scoreBreakdown.frequencyScore).toBe(1);
    expect(result.scoreBreakdown.impactScore).toBe(0);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBe(0);
    expect(result.colorCode).toBe('#00FF00');
    expect(result.calculatedAt).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});