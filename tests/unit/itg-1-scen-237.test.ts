import { calculatePriorityScoreForIssue } from '../../src/logic/priority-scoring-engine';

describe('朝会報告管理システム - 優先度スコア計算エンジン', () => {
  // SCEN-237
  test('課題リストが空のときは InsufficientHistoryDataError を発生させる', () => {
    const issueId = '';
    const frequency = 0;
    const impactScore = 0;
    const frequencyWeight = 0.4;
    const impactWeight = 0.6;

    expect(() => {
      calculatePriorityScoreForIssue(
        issueId,
        frequency,
        impactScore,
        frequencyWeight,
        impactWeight
      );
    }).toThrow(/過去30日間の課題発生履歴データが不足/);
  });
});