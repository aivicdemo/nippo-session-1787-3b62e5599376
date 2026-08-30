import { calculatePriorityScoreForIssue } from '../../src/logic/priority-scoring-engine';
import { type IssuePriorityScoringInput, type IssuePriorityScore } from '../../src/logic/priority-scoring-engine';

describe('Priority Scoring Engine', () => {
  test('SCEN-231: [edge] 抽出された課題キーワードが空のとき、優先度スコアは0で優先度ランクはLOW、色コードはGREENを返す', () => {
    // Arrange
    const input: IssuePriorityScoringInput = {
      issueId: '',
      frequency: 0,
      impactScore: 0,
      frequencyWeight: 0.4,
      impactWeight: 0.6,
    };

    // Act
    const result: IssuePriorityScore = calculatePriorityScoreForIssue(input);

    // Assert
    expect(result.issueId).toBe('');
    expect(result.priorityScore).toBe(0);
    expect(result.priorityRank).toBe('LOW');
    expect(result.colorCode).toBe('GREEN');
  });
});