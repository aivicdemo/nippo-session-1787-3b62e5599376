import { describe, it, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコア計算・色分け表示機能', () => {
  it('SCEN-2778: 優先度スコアが中優先度閾値直上（51）の課題が中優先度色で表示される', () => {
    // 優先度スコア51に対応する課題オブジェクトを生成
    const issueInput = {
      issueId: 'issue-scen2778-001',
      issueContent: 'テスト課題',
      occurrenceFrequency: 3,
      impactScore: 51,
      affectedTeamCount: 2,
      resolutionDaysAverage: 5,
      reportingDate: '2024-01-15',
      teamId: 'team-001',
    };

    // calculateIssuePriorityScoreを呼び出し
    const result = calculateIssuePriorityScore(issueInput);

    // 優先度スコアが51であることを確認
    expect(result.priorityScore).toBe(51);

    // 優先度ランクが中優先度（'中'）であることを確認
    expect(result.priorityRank).toBe('中');

    // 色コードが中優先度色（#FFFF00）であることを確認
    expect(result.colorCode).toBe('#FFFF00');

    // scoreBreakdownが存在し、正規の構造を持つことを確認
    expect(result.scoreBreakdown).toBeDefined();
    expect(result.scoreBreakdown.frequencyScore).toBeDefined();
    expect(result.scoreBreakdown.impactScore).toBeDefined();
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeDefined();

    // calculatedAtがISO 8601形式の文字列であることを確認
    expect(typeof result.calculatedAt).toBe('string');
    expect(result.calculatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    // issueIdが入力と一致することを確認
    expect(result.issueId).toBe('issue-scen2778-001');
  });
});