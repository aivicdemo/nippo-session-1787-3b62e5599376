import { calculatePriorityScoreForIssue } from '../../src/logic/priority-scoring-engine';

describe('Priority Scoring Engine', () => {
  // SCEN-261: [edge] 影響度スコアが範囲外（100超過）のときにエラーを発生させる
  test('should throw OutOfRangeScoreError when impactScore exceeds 100', () => {
    const issueId = 'ISSUE-001';
    const frequency = 50;
    const impactScore = 105;
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