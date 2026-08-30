import { calculatePriorityScoreForIssue } from '../../src/logic/priority-scoring-engine';

describe('朝会報告管理システム - 優先度スコア計算エンジン', () => {
  // SCEN-242: 影響度スコアがチーム総人数を超える境界条件でのエラーハンドリング
  test('影響度スコア（impactScore）が0～100の範囲を超える場合、OutOfRangeScoreErrorをスローする', () => {
    const input = {
      issueId: 'ISSUE-001',
      frequency: 45,
      impactScore: 120,
      frequencyWeight: 0.4,
      impactWeight: 0.6,
    };

    expect(() => calculatePriorityScoreForIssue(input)).toThrow(/影響度スコア/);
  });
});