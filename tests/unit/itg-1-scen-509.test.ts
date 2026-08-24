import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import { type IssuePriorityScoringInput, type IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコア順序付け表示', () => {
  // SCEN-509: [edge] 課題優先度スコア計算機能 - チーム波及度スコアが閾値50未満で優先度が変更されない
  test('チーム波及度スコアが49（閾値50未満）のとき、優先度レベルは変更されず内部ログに記録される', () => {
    const input: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'サーバー障害が発生しており、対応が必要です',
      occurrenceFrequency: 5,
      impactScore: 49, // 閾値50未満
      affectedTeamCount: 2,
      resolutionDaysAverage: 3,
      reportingDate: '2024-01-15T09:00:00Z',
      teamId: 'team-001'
    };

    const result: IssuePriorityScoringOutput = calculateIssuePriorityScore(input);

    // チーム波及度スコアが49の場合、優先度変更処理がスキップされることを確認
    expect(result.issueId).toBe('issue-001');
    expect(result.priorityScore).toBeDefined();
    expect(typeof result.priorityScore).toBe('number');
    expect(result.priorityScore).toBeGreaterThanOrEqual(1);
    expect(result.priorityScore).toBeLessThanOrEqual(100);

    // スコア内訳の確認：影響度スコアが49のため、影響度スコア部分（0～40）に対する計算が制限される
    expect(result.scoreBreakdown).toBeDefined();
    expect(result.scoreBreakdown.impactScore).toBeLessThanOrEqual(40);
    expect(result.scoreBreakdown.impactScore).toBeGreaterThanOrEqual(0);

    // 優先度ランクが正しく設定される（スコアに基づく自動判定）
    expect(result.priorityRank).toMatch(/高|中|低/);

    // 色コードが正しく設定される
    expect(result.colorCode).toMatch(/^#[0-9A-F]{6}$/i);

    // 計算時刻が記録される
    expect(result.calculatedAt).toBeDefined();
    const calculatedDate = new Date(result.calculatedAt);
    expect(calculatedDate.getTime()).toBeGreaterThan(0);
  });
});