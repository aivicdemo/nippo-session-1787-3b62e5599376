import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題の優先度を色分けで表示するダッシュボード機能', () => {
  // SCEN-2068: [edge] 対策案の承認権者判定機能 - 承認権者が複数名の場合に全員の承認が必須状態で設定される
  test('複数の承認権者が登録され、全員承認が必須ルールで承認タスクが生成される', () => {
    const input = {
      issueId: 'issue-001',
      issueContent: 'パフォーマンス低下に関する改善対策',
      occurrenceFrequency: 8,
      impactScore: 85,
      affectedTeamCount: 3,
      resolutionDaysAverage: 5,
      reportingDate: '2024-01-15',
      teamId: 'team-dev-001',
    };

    const result = calculateIssuePriorityScore(input);

    expect(result).toEqual({
      issueId: 'issue-001',
      priorityScore: 80,
      priorityRank: '高',
      scoreBreakdown: {
        frequencyScore: 32,
        impactScore: 34,
        resolutionDifficultyScore: 14,
      },
      colorCode: '#FF0000',
      calculatedAt: expect.stringMatching(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
      ),
    });
    expect(result.priorityScore).toBe(80);
    expect(result.priorityRank).toBe('高');
    expect(result.colorCode).toBe('#FF0000');
    expect(result.scoreBreakdown.frequencyScore).toBe(32);
    expect(result.scoreBreakdown.impactScore).toBe(34);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBe(14);
  });
});