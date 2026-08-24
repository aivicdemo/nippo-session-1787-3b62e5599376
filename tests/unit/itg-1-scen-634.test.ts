import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度スコア計算機能 - 重複キーワード統合', () => {
  // SCEN-634
  test('重複する課題キーワードが統合された状態で優先度スコアが計算される', () => {
    const input = {
      issueId: 'issue-001',
      issueContent: 'システム障害が発生しており、ネットワーク遅延が確認されています。',
      occurrenceFrequency: 3,
      impactScore: 75,
      affectedTeamCount: 2,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: 'team-001',
    };

    const result = calculateIssuePriorityScore(input);

    expect(result.issueId).toBe('issue-001');
    expect(result.priorityScore).toBe(68);
    expect(result.priorityRank).toBe('高');
    expect(result.scoreBreakdown.frequencyScore).toBe(30);
    expect(result.scoreBreakdown.impactScore).toBe(30);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBe(8);
    expect(result.colorCode).toBe('#FF0000');
    expect(result.calculatedAt).toBeDefined();
  });
});