import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度スコア計算・色分け表示機能', () => {
  // SCEN-936: [normal] 優先度スコア40未満の課題に緑色ラベルを付与する
  test('スコア35の課題に緑色ラベルが適用される', () => {
    const issueInput = {
      issueId: 'ISSUE-001',
      issueContent: '軽微なバグ',
      occurrenceFrequency: 1,
      impactScore: 35,
      affectedTeamCount: 1,
      resolutionDaysAverage: 1,
      reportingDate: '2024-01-15T09:00:00Z',
      teamId: 'TEAM-001'
    };

    const result = calculateIssuePriorityScore(issueInput);

    expect(result.priorityScore).toBe(35);
    expect(result.priorityScore).toBeLessThan(40);
    expect(result.priorityRank).toBe('低');
    expect(result.colorCode).toBe('#00FF00');
  });
});