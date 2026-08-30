import { calculatePriorityScoreForIssue } from '../../src/logic/priority-scoring-engine';

describe('Priority Scoring Engine', () => {
  // SCEN-256
  test('should throw InsufficientHistoryDataError when issue data is empty', () => {
    const issueId = '';
    const frequency = 0;
    const impactScore = 0;

    expect(() => {
      calculatePriorityScoreForIssue(issueId, frequency, impactScore);
    }).toThrow(/優先度スコア計算に必要な過去30日間の課題発生履歴データが不足しています/);
  });
});