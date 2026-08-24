import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコア付けによる順序付け表示', () => {
  // SCEN-814: [edge] 課題優先度スコア算出機能 - 過去7日間の発生頻度が0回超のとき、本日報告と組み合わせて優先度スコアが加算される
  test('過去7日間の発生頻度と本日報告スコアが正しく加算される', () => {
    const input: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'データベース接続エラー',
      occurrenceFrequency: 3,
      impactScore: 65,
      affectedTeamCount: 2,
      resolutionDaysAverage: 2.5,
      reportingDate: '2024-01-15T10:30:00Z',
      teamId: 'team-001',
    };

    const result = calculateIssuePriorityScore(input);

    expect(result.issueId).toBe('issue-001');
    expect(result.priorityScore).toBe(35);
    expect(result.scoreBreakdown.frequencyScore).toBe(15);
    expect(result.scoreBreakdown.impactScore).toBe(20);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBe(0);
    expect(result.priorityRank).toBe('中');
    expect(result.colorCode).toBe('#FFFF00');
    expect(typeof result.calculatedAt).toBe('string');
  });
});