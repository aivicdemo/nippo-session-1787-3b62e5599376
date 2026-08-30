import { calculatePriorityScoreForIssue } from '../../src/logic/priority-scoring-engine';

describe('Priority Scoring Engine', () => {
  // SCEN-057
  test('should throw InsufficientHistoryDataError when issue frequency is zero indicating no historical data', () => {
    const input = {
      issueId: 'ISSUE-001',
      frequency: 0,
      impactScore: 50,
      frequencyWeight: 0.4,
      impactWeight: 0.6,
    };

    expect(() => calculatePriorityScoreForIssue(input)).toThrow(
      /優先度スコア計算に必要な過去30日間の課題発生履歴データが不足しています/
    );
  });
});