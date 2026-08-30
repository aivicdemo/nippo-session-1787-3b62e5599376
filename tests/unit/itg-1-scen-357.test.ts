import { calculatePriorityScoreForIssue } from '../../src/logic/priority-scoring-engine';

describe('朝会報告管理システム - 優先度スコア計算エンジン', () => {
  test('SCEN-357: 影響度評価データが存在しないキーワードのときに警告を発生させつつ優先度スコアを計算する', () => {
    // Arrange
    const issueId = 'ISSUE-001';
    const frequency = 50;
    const impactScore = 75;
    const frequencyWeight = 0.4;
    const impactWeight = 0.6;

    // Act
    const result = calculatePriorityScoreForIssue({
      issueId,
      frequency,
      impactScore,
      frequencyWeight,
      impactWeight,
    });

    // Assert - 計算結果の検証
    // priorityScore = (frequency * 0.4) + (impactScore * 0.6) = (50 * 0.4) + (75 * 0.6) = 20 + 45 = 65
    expect(result.priorityScore).toBe(65);

    // priorityRank判定: 65は40以上70未満なのでMEDIUM
    expect(result.priorityRank).toBe('MEDIUM');

    // colorCode判定: MEDIUMはYELLOW
    expect(result.colorCode).toBe('YELLOW');

    // 警告情報の存在確認
    expect(result.warning).toBeDefined();
    expect(result.warning).toMatch(/影響度が未評価/);
    expect(result.warning).toMatch(/マスタデータを確認/);
  });
});