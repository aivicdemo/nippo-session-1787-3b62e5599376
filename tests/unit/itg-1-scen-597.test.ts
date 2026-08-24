import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput, IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度（チーム全体への波及度）を判定し、優先度スコアで順序付けして表示する機能', () => {
  // SCEN-597: [edge] 課題優先度判定機能 - 影響度スコアが100（上限値）の場合、優先度ランクが高に判定される
  test('影響度スコアが100の場合、優先度ランクが高に判定される', () => {
    const input: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: '本番環境でのシステム障害が発生',
      occurrenceFrequency: 5,
      impactScore: 100,
      affectedTeamCount: 8,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15T10:30:00Z',
      teamId: 'team-alpha',
    };

    const result: IssuePriorityScoringOutput = calculateIssuePriorityScore(input);

    expect(result.issueId).toBe('issue-001');
    expect(result.priorityRank).toBe('高');
    expect(result.priorityScore).toBe(95);
    expect(result.colorCode).toBe('#FF0000');
    expect(result.scoreBreakdown.frequencyScore).toBe(20);
    expect(result.scoreBreakdown.impactScore).toBe(40);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBe(35);
    expect(typeof result.calculatedAt).toBe('string');
  });
});