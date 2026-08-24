import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度（チーム全体への波及度）を判定し、優先度スコアで順序付けして表示する機能', () => {
  // SCEN-949
  test('影響度スコアが数値以外の型のとき優先度スコア計算がエラーを返す', () => {
    const invalidInput = {
      issueId: 'issue-001',
      issueContent: 'テストの品質が低下している',
      occurrenceFrequency: 5,
      impactScore: 'high' as unknown as number,
      affectedTeamCount: 2,
      resolutionDaysAverage: 3,
      reportingDate: '2024-01-15',
      teamId: 'team-001',
    };

    expect(() => calculateIssuePriorityScore(invalidInput)).toThrow(/影響度スコア/);
  });
});