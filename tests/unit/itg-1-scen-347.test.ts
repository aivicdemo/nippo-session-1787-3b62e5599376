import { calculatePriorityScoreForIssue } from '../../src/logic/priority-scoring-engine';

describe('朝会報告管理システム - 優先度スコア計算エンジン', () => {
  // SCEN-347
  test('発生頻度の重みと影響度の重みの合計が1を超える場合、エラーをスロー', () => {
    const issueList = [
      { issueId: 'issue-001', frequency: 10, impactScore: 75 },
      { issueId: 'issue-002', frequency: 5, impactScore: 50 },
      { issueId: 'issue-003', frequency: 8, impactScore: 60 }
    ];

    const frequencyWeight = 0.6;
    const impactWeight = 0.5;
    const highlightThresholdPercentile = 30;

    expect(() =>
      calculatePriorityScoreForIssue(
        issueList,
        frequencyWeight,
        impactWeight,
        highlightThresholdPercentile
      )
    ).toThrow(/重みの設定が不正です/);
  });
});