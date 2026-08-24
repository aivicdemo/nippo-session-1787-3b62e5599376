import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput, IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコア計算', () => {
  // SCEN-3011
  test('チーム波及度スコアが閾値未満（49点）のときスコアが下限側で計算される', () => {
    const input: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'データベース接続エラー',
      occurrenceFrequency: 2,
      impactScore: 49,
      affectedTeamCount: 1,
      resolutionDaysAverage: 1,
      reportingDate: '2024-01-15',
      teamId: 'team-dev-001',
    };

    const result: IssuePriorityScoringOutput = calculateIssuePriorityScore(input);

    expect(result.issueId).toBe('issue-001');
    expect(result.priorityScore).toBeGreaterThanOrEqual(1);
    expect(result.priorityScore).toBeLessThanOrEqual(39);
    expect(result.priorityRank).toBe('低');
    expect(result.scoreBreakdown.frequencyScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.frequencyScore).toBeLessThanOrEqual(40);
    expect(result.scoreBreakdown.impactScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.impactScore).toBeLessThanOrEqual(40);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeLessThanOrEqual(20);
    expect(result.colorCode).toBe('#00FF00');
    expect(result.calculatedAt).toBeTruthy();
  });
});