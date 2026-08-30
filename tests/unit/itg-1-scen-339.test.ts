import { calculatePriorityScoreForIssue } from '../../src/logic/priority-scoring-engine';
import type { IssuePriorityScoringInput, IssuePriorityScore } from '../../src/logic/priority-scoring-engine';

describe('Priority Scoring Engine', () => {
  // SCEN-339
  test('should normalize negative frequency to 0 and calculate priority score correctly', () => {
    const input: IssuePriorityScoringInput = {
      issueId: 'ISSUE-001',
      frequency: -5,
      impactScore: 50,
    };

    const result: IssuePriorityScore = calculatePriorityScoreForIssue(input);

    expect(result.issueId).toBe('ISSUE-001');
    expect(result.priorityScore).toBe(35);
    expect(result.priorityRank).toBe('MEDIUM');
    expect(result.colorCode).toBe('YELLOW');
  });
});