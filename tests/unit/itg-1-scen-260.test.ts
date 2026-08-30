import { calculatePriorityScoreForIssue } from '../../src/logic/priority-scoring-engine';

describe('Priority Scoring Engine - calculatePriorityScoreForIssue', () => {
  // SCEN-260: [error] 発生回数が負の数のときエラーが発生する
  test('should throw InvalidIssueDataError when frequency is negative', () => {
    const input = {
      issueId: 'ISSUE-001',
      frequency: -5,
      impactScore: 75,
      frequencyWeight: 0.4,
      impactWeight: 0.6,
    };

    expect(() => calculatePriorityScoreForIssue(input)).toThrow(/発生頻度/);
  });
});