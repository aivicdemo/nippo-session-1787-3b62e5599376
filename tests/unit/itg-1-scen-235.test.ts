import { calculatePriorityScoreForIssue } from '../../src/logic/priority-scoring-engine';

describe('Priority Scoring Engine', () => {
  // SCEN-235
  test('should throw OutOfRangeScoreError when frequency is negative value', () => {
    const input = {
      issueId: 'ISSUE-001',
      frequency: -5,
      impactScore: 50,
    };

    expect(() => calculatePriorityScoreForIssue(input)).toThrow(/影響度スコア/);
  });
});