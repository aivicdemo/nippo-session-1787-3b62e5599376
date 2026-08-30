import { calculatePriorityScoreForIssue } from '../../src/logic/priority-scoring-engine';

describe('朝会報告管理システム - 優先度スコア計算エンジン', () => {
  test('SCEN-246: 課題キーワードが空文字列のときにエラーをスロー', () => {
    // Arrange
    const invalidInput = {
      issueId: '',
      frequency: 50,
      impactScore: 75,
    };

    // Act & Assert
    expect(() => calculatePriorityScoreForIssue(invalidInput)).toThrow(/課題データ/);
  });
});