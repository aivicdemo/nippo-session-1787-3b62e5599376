import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput, IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Impact Assessment - Priority Score Calculation', () => {
  // SCEN-1301: [normal] 課題影響度判定機能 - 影響度スコアが0件の課題集合から空の判定結果が返される
  test('should return empty result when input issues array is empty', () => {
    const emptyInput: IssuePriorityScoringInput[] = [];

    const result = calculateIssuePriorityScore(emptyInput);

    expect(Array.isArray(result)).toBe(true);
    expect(result).toEqual([]);
  });
});