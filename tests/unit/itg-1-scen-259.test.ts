import { calculatePriorityScoreForIssue } from '../../src/logic/priority-scoring-engine';

describe('Priority Scoring Engine', () => {
  test('SCEN-259: Should throw OutOfRangeScoreError when impactScore exceeds 0-100 range', () => {
    const issueId = 'ISSUE-001';
    const frequency = 50;
    const impactScore = 120;
    const frequencyWeight = 0.4;
    const impactWeight = 0.6;

    expect(() =>
      calculatePriorityScoreForIssue({
        issueId,
        frequency,
        impactScore,
        frequencyWeight,
        impactWeight,
      })
    ).toThrow(/影響度スコア/);
  });
});