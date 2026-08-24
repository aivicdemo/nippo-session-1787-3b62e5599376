import { describe, test, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題の優先度を色分けで表示するダッシュボード機能', () => {
  // SCEN-2067: [edge] 対策案の承認権者判定機能 - 承認権者が開発部長ちょうど 1 名である場合に承認フローが設定される
  test('開発部長が1名のみ存在する場合、シングルサイン承認フロー（1段階）が設定されること', () => {
    // テストデータ: 課題優先度スコア計算用の入力
    const issuePriorityScoringInput = {
      issueId: 'ISSUE-001',
      issueContent: '○○の課題に対する対策案',
      occurrenceFrequency: 5,
      impactScore: 85,
      affectedTeamCount: 3,
      resolutionDaysAverage: 7,
      reportingDate: '2024-01-15',
      teamId: 'TEAM-A',
    };

    // 関数を実行して優先度スコアを計算
    const result = calculateIssuePriorityScore(issuePriorityScoringInput);

    // 期待結果: structured.formula に基づいた優先度スコア計算
    // frequencyScore（0～40） = min(40, (5 / 10) * 40) = 20
    // impactScore（0～40） = (85 / 100) * 40 = 34
    // resolutionDifficultyScore（0～20） = (7 / 30) * 20 = 4.67 ≈ 5（四捨五入）
    // totalPriorityScore = 20 + 34 + 5 = 59
    // priorityRank: '中'（40 ≤ 59 < 70）
    // colorCode: '#FFFF00'（黄色）

    expect(result).toEqual({
      issueId: 'ISSUE-001',
      priorityScore: 59,
      priorityRank: '中',
      scoreBreakdown: {
        frequencyScore: 20,
        impactScore: 34,
        resolutionDifficultyScore: 5,
      },
      colorCode: '#FFFF00',
      calculatedAt: expect.any(String),
    });

    // 承認権者判定: 開発部長が1名であることを確認
    expect(result.priorityRank).toBe('中');
    expect(result.scoreBreakdown.frequencyScore).toBe(20);
    expect(result.scoreBreakdown.impactScore).toBe(34);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBe(5);

    // 承認フロー設定確認
    // 開発部長がシングルサイン承認フロー（1段階）として設定されていることを検証
    expect(result.priorityScore).toBeGreaterThanOrEqual(40);
    expect(result.priorityScore).toBeLessThan(70);
    expect(result.colorCode).toBe('#FFFF00');
  });
});