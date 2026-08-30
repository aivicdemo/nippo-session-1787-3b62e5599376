import { calculatePriorityScoreForIssue } from '../../src/logic/priority-scoring-engine';

describe('朝会報告管理システム - 優先度スコア計算エンジン', () => {
  test('SCEN-241: 発生頻度が負の数のとき、InvalidIssueDataErrorがスローされること', () => {
    // Arrange
    const input = {
      issueId: 'ISSUE-001',
      frequency: -5,
      impactScore: 50,
    };

    // Act & Assert
    expect(() => calculatePriorityScoreForIssue(input)).toThrow(/発生頻度/);
  });
});