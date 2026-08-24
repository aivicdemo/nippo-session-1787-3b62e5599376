import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import { type IssuePriorityScoringInput } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコア付け', () => {
  // SCEN-620
  test('抽出された課題リストが null のとき例外を発生させる', () => {
    const nullInput: IssuePriorityScoringInput | null = null;

    expect(() => {
      calculateIssuePriorityScore(nullInput as any);
    }).toThrow(/抽出された課題リスト/);
  });
});