import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput, IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコア計算', () => {
  // SCEN-510
  test('[edge] チーム波及度スコア100で最高優先度に昇格される', () => {
    // アレンジ: チーム波及度スコアが100の場合のテスト入力を準備
    const input: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'システム全体の認証機能が停止',
      occurrenceFrequency: 3,
      impactScore: 100,
      affectedTeamCount: 5,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: 'team-engineering'
    };

    // アクト: 優先度スコア計算関数を実行
    const result: IssuePriorityScoringOutput = calculateIssuePriorityScore(input);

    // アサート: 計算結果を検証
    // impactScore=100の場合、最高優先度ランク（'高'）となることを確認
    expect(result.issueId).toBe('issue-001');
    expect(result.priorityScore).toBeGreaterThanOrEqual(70);
    expect(result.priorityRank).toBe('高');
    expect(result.colorCode).toBe('#FF0000');

    // スコア内訳の検証
    // impactScore=100に対応する影響度スコア部分が最大値(40)であることを確認
    expect(result.scoreBreakdown.impactScore).toBe(40);
    expect(result.scoreBreakdown.frequencyScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.frequencyScore).toBeLessThanOrEqual(40);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeLessThanOrEqual(20);

    // 計算日時が正しく記録されていることを確認（ISO 8601形式）
    expect(result.calculatedAt).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?/);
  });
});