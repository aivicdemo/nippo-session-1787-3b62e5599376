import { calculatePriorityScoreForIssue } from '../../src/logic/priority-scoring-engine';

describe('Priority Scoring Engine', () => {
  test('SCEN-233: should throw InsufficientHistoryDataError when frequency is 0 indicating insufficient past 30-day issue history', () => {
    const issueId = 'ISSUE-001';
    const frequency = 0;
    const impactScore = 50;
    const frequencyWeight = 0.4;
    const impactWeight = 0.6;

    expect(() => {
      calculatePriorityScoreForIssue({
        issueId,
        frequency,
        impactScore,
        frequencyWeight,
        impactWeight,
      });
    }).toThrow(/優先度スコア計算に必要な過去30日間の課題発生履歴データが不足しています/);
  });
});