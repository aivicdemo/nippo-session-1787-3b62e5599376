import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput, IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Priority Scoring - Empty Issues', () => {
  // SCEN-2948
  test('should return empty array when no issues are provided', () => {
    const emptyIssues: IssuePriorityScoringInput[] = [];

    const result: IssuePriorityScoringOutput[] = calculateIssuePriorityScore(emptyIssues);

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
    expect(result).toEqual([]);
  });
});