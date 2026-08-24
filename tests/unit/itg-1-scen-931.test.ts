import { describe, it, expect, beforeEach } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput, IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Priority Score Calculation', () => {
  // SCEN-931
  it('should return empty array when zero issues are provided', () => {
    const emptyIssueInput: IssuePriorityScoringInput[] = [];
    
    const result: IssuePriorityScoringOutput[] = calculateIssuePriorityScore(emptyIssueInput);
    
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });
});