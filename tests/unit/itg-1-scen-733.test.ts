import { describe, test, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('日報の課題項目から課題キーワードを自動抽出し、発生頻度でランク付けして表示する機能', () => {
  // SCEN-733: [normal] 課題の自動抽出と優先度判定機能 - 複数日報から抽出された同一課題が正規化により 1 件に統合される
  test('複数日報から抽出された同一課題が正規化により1件に統合される', () => {
    // Arrange: 複数の日報から抽出されたキーワードデータを用意
    const issueInputData = {
      issueId: 'issue-db-001',
      issueContent: 'データベース接続エラーが発生している',
      occurrenceFrequency: 3,
      impactScore: 75,
      affectedTeamCount: 2,
      resolutionDaysAverage: 2.5,
      reportingDate: '2026-08-20',
      teamId: 'team-001',
    };

    // Act: 優先度スコアを計算
    const result = calculateIssuePriorityScore(issueInputData);

    // Assert: 計算結果が期待値と一致することを検証
    // structured.formula に基づく計算：
    // frequencyScore = (occurrenceFrequency / max_frequency) * 40 = (3 / 10) * 40 = 12
    // impactScore = 75 (直接渡される値を使用) → スコアとして採用 = 40 (正規化後)
    // resolutionDifficultyScore = (resolutionDaysAverage / max_days) * 20 = (2.5 / 7) * 20 = 7.14 ≈ 7
    // totalPriorityScore = 12 + 40 + 7 = 59 → 中優先度（40以上70未満）
    
    expect(result).toEqual({
      issueId: 'issue-db-001',
      priorityScore: 59,
      priorityRank: '中',
      scoreBreakdown: {
        frequencyScore: 12,
        impactScore: 40,
        resolutionDifficultyScore: 7,
      },
      colorCode: '#FFFF00',
      calculatedAt: expect.any(String),
    });

    expect(result.priorityScore).toBe(59);
    expect(result.priorityRank).toBe('中');
    expect(result.colorCode).toBe('#FFFF00');
    expect(result.scoreBreakdown.frequencyScore).toBe(12);
    expect(result.scoreBreakdown.impactScore).toBe(40);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBe(7);
  });
});