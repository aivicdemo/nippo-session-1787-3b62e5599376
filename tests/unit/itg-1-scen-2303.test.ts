import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度（チーム全体への波及度）を判定し、優先度スコアで順序付けして表示する機能', () => {
  // SCEN-2303: [edge] 課題影響度判定機能 - チーム波及度スコアがちょうど 100 の場合、課題優先度が最高ランクとして計算される
  test('チーム波及度スコアが 100 のとき、優先度ランクが最高ランク（高）として計算される', () => {
    const input = {
      issueId: 'ISSUE-001',
      issueContent: 'Critical system performance degradation affecting all teams',
      occurrenceFrequency: 5,
      impactScore: 100,
      affectedTeamCount: 10,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: 'TEAM-001',
    };

    const result = calculateIssuePriorityScore(input);

    expect(result.issueId).toBe('ISSUE-001');
    expect(result.priorityScore).toBe(100);
    expect(result.priorityRank).toBe('高');
    expect(result.colorCode).toBe('#FF0000');
    expect(result.scoreBreakdown).toEqual({
      frequencyScore: 40,
      impactScore: 40,
      resolutionDifficultyScore: 20,
    });
    expect(result.calculatedAt).toBeDefined();
    expect(typeof result.calculatedAt).toBe('string');
  });
});