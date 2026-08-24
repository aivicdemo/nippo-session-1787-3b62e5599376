import { describe, test, expect, beforeEach } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type {
  IssuePriorityScoringInput,
  IssuePriorityScoringOutput,
} from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコア順序付け機能', () => {
  // SCEN-2149
  test('同じ入力データで2回実行した場合、毎回同じ優先度スコアと順序が返される', () => {
    // テスト用の統一された入力データを準備
    const testInput: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'データベース接続エラーが頻繁に発生している',
      occurrenceFrequency: 5,
      impactScore: 85,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2.5,
      reportingDate: '2024-01-15',
      teamId: 'team-engineering-001',
    };

    // 1回目の実行
    const result1: IssuePriorityScoringOutput = calculateIssuePriorityScore(testInput);

    // 2回目の実行（同一入力データ）
    const result2: IssuePriorityScoringOutput = calculateIssuePriorityScore(testInput);

    // 優先度スコア値の完全一致を検証
    expect(result1.priorityScore).toBe(result2.priorityScore);

    // 優先度ランクの完全一致を検証
    expect(result1.priorityRank).toBe(result2.priorityRank);

    // スコア内訳の完全一致を検証
    expect(result1.scoreBreakdown.frequencyScore).toBe(
      result2.scoreBreakdown.frequencyScore,
    );
    expect(result1.scoreBreakdown.impactScore).toBe(
      result2.scoreBreakdown.impactScore,
    );
    expect(result1.scoreBreakdown.resolutionDifficultyScore).toBe(
      result2.scoreBreakdown.resolutionDifficultyScore,
    );

    // 色コードの完全一致を検証
    expect(result1.colorCode).toBe(result2.colorCode);

    // 課題IDの一致を検証
    expect(result1.issueId).toBe(result2.issueId);
    expect(result1.issueId).toBe('issue-001');

    // 計算実行日時は異なる可能性があるが、スコア値と順序は同じであることを確認
    expect(typeof result1.calculatedAt).toBe('string');
    expect(typeof result2.calculatedAt).toBe('string');

    // 優先度スコアが1～100の範囲内であることを確認
    expect(result1.priorityScore).toBeGreaterThanOrEqual(1);
    expect(result1.priorityScore).toBeLessThanOrEqual(100);
    expect(result2.priorityScore).toBeGreaterThanOrEqual(1);
    expect(result2.priorityScore).toBeLessThanOrEqual(100);
  });
});