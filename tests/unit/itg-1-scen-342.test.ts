import { calculatePriorityScoreForIssue } from '../../src/logic/priority-scoring-engine';

describe('Priority Scoring Engine', () => {
  // SCEN-342
  test('should return default values when issue list is empty', () => {
    const result = calculatePriorityScoreForIssue({
      issueId: '',
      frequency: 0,
      impactScore: 0,
    });

    expect(result.issueId).toBe('');
    expect(result.priorityScore).toBe(0);
    expect(result.priorityRank).toBe('LOW');
    expect(result.colorCode).toBe('GREEN');
  });
});