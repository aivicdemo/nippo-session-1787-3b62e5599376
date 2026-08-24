import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度（チーム全体への波及度）を判定し、優先度スコアで順序付けして表示する機能', () => {
  test('SCEN-1349: [edge] 課題影響度判定機能 - 影響度スコア0点（最小値）の課題が正確に低優先度に判定される', () => {
    const issueInput = {
      issueId: 'issue-edge-impact-0',
      issueContent: '軽微な表記ゆれ',
      occurrenceFrequency: 1,
      impactScore: 0,
      affectedTeamCount: 1,
      resolutionDaysAverage: 0.5,
      reportingDate: '2024-01-15T09:00:00Z',
      teamId: 'team-001',
    };

    const result = calculateIssuePriorityScore(issueInput);

    expect(result.priorityScore).toBe(1);
    expect(result.priorityRank).toBe('低');
    expect(result.issueId).toBe('issue-edge-impact-0');
    expect(result.colorCode).toBe('#00FF00');
    expect(result.scoreBreakdown).toEqual({
      frequencyScore: 1,
      impactScore: 0,
      resolutionDifficultyScore: 0,
    });
    expect(typeof result.calculatedAt).toBe('string');
  });
});