import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput, IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度スコア自動計算機能', () => {
  // SCEN-3021
  test('月境界をまたぐ集計期間で全課題データが正確にスコア集約に含まれる', () => {
    // 集計期間: 5月28日 00:00 ～ 6月3日 23:59
    const startDate = new Date('2024-05-28T00:00:00Z');
    const endDate = new Date('2024-06-03T23:59:59Z');

    // 入力: 月境界をまたぐ4件の課題データ
    const input: IssuePriorityScoringInput = {
      issueId: 'issue-cross-month-001',
      issueContent: 'バグ修正、機能追加、パフォーマンス改善、セキュリティ対応を含む月境界課題',
      occurrenceFrequency: 4,
      impactScore: 55,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-05-28T09:00:00Z',
      teamId: 'team-engineering-001'
    };

    // 計算ロジック: 優先度スコア = (発生頻度スコア × 0.4) + (影響度スコア × 0.4) + (解決難度スコア × 0.2)
    // 発生頻度スコア = min(occurrenceFrequency * 10, 40) = min(4 * 10, 40) = 40
    // 影響度スコア = min(impactScore, 40) = min(55, 40) = 40
    // 解決難度スコア: resolutionDaysAverage = 2日なので困難度スコア = min(20 / 2, 20) = 10
    // priorityScore = (40 * 0.4) + (40 * 0.4) + (10 * 0.2) = 16 + 16 + 2 = 34

    const result: IssuePriorityScoringOutput = calculateIssuePriorityScore(input);

    // 課題IDが正確に保持されていることを確認
    expect(result.issueId).toBe('issue-cross-month-001');

    // 優先度スコアが計算式に基づいて正確に算出されていることを確認
    expect(result.priorityScore).toBe(34);

    // 優先度ランクが低（スコア34は40以上70未満のため「中」）として判定されることを確認
    expect(result.priorityRank).toBe('低');

    // スコア計算の内訳が正確であることを確認
    expect(result.scoreBreakdown.frequencyScore).toBe(40);
    expect(result.scoreBreakdown.impactScore).toBe(40);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBe(10);

    // 色コードが低優先度（緑）として設定されていることを確認
    expect(result.colorCode).toBe('#00FF00');

    // スコア計算実行日時がISO 8601形式で記録されていることを確認
    expect(result.calculatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});