import { calculatePriorityScoreForIssue } from '../../src/logic/priority-scoring-engine';

describe('Priority Scoring Engine', () => {
  // SCEN-388
  test('should return zero priority score and LOW rank when issue data is empty', () => {
    const emptyIssueInput = {
      issueId: '',
      frequency: 0,
      impactScore: 0,
    };

    const result = calculatePriorityScoreForIssue(emptyIssueInput);

    expect(result.priorityScore).toBe(0);
    expect(result.priorityRank).toBe('LOW');
    expect(result.colorCode).toBe('GREEN');
  });
});