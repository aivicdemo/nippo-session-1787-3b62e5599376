import { calculatePriorityScoreForIssue } from '../../src/logic/priority-scoring-engine';
import { type IssuePriorityScoringInput } from '../../src/logic/priority-scoring-engine';

describe('朝会報告管理システム - 優先度スコア計算エンジン', () => {
  test('SCEN-240: 影響度スコアがチームサイズ上限を超える場合、OutOfRangeScoreError例外を発生させる', () => {
    const input: IssuePriorityScoringInput = {
      issueId: 'ISSUE-001',
      frequency: 50,
      impactScore: 120,
      frequencyWeight: 0.4,
      impactWeight: 0.6,
    };

    expect(() => calculatePriorityScoreForIssue(input)).toThrow(/影響度スコア/);
  });
});