import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度スコア計算機能', () => {
  // SCEN-146: [edge] 課題影響度判定機能 - チーム波及度スコアが0未満の不正値が入力されたとき、0として正規化される
  test('チーム波及度スコアが負の値のとき、0に正規化されてスコア計算に使用される', () => {
    const input = {
      issueId: 'ISSUE-001',
      issueContent: 'データベース接続エラー',
      occurrenceFrequency: 5,
      impactScore: -5,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: 'TEAM-A'
    };

    const result = calculateIssuePriorityScore(input);

    expect(result.issueId).toBe('ISSUE-001');
    expect(typeof result.priorityScore).toBe('number');
    expect(result.priorityScore).toBeGreaterThanOrEqual(1);
    expect(result.priorityScore).toBeLessThanOrEqual(100);
    expect(result.scoreBreakdown.impactScore).toBe(0);
    expect(result.scoreBreakdown.frequencyScore).toBeGreaterThan(0);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeGreaterThanOrEqual(0);
    expect(result.priorityRank).toMatch(/高|中|低/);
    expect(result.colorCode).toMatch(/^#[0-9A-F]{6}$/);
    expect(typeof result.calculatedAt).toBe('string');
  });
});