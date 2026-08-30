import { calculatePriorityScoreForIssue } from '../../src/logic/priority-scoring-engine';

describe('朝会報告管理システム - 優先度スコア計算エンジン', () => {
  test('SCEN-249: 影響度スコアが範囲外（100超過）の場合、OutOfRangeScoreErrorをスロー', () => {
    // Arrange
    const issueId = 'ISSUE-001';
    const frequency = 50;
    const impactScore = 150;
    const frequencyWeight = 0.4;
    const impactWeight = 0.6;

    // Act & Assert
    expect(() => {
      calculatePriorityScoreForIssue({
        issueId,
        frequency,
        impactScore,
        frequencyWeight,
        impactWeight,
      });
    }).toThrow(/影響度スコアは0～100の範囲で指定してください/);
  });
});