import { calculatePriorityScoreForIssue } from '../../src/logic/priority-scoring-engine';

describe('Priority Scoring Engine', () => {
  // SCEN-387
  test('should calculate priority score and rank based on frequency and impact score', () => {
    const input = {
      issueId: 'issue-001',
      frequency: 80,
      impactScore: 75,
      frequencyWeight: 0.4,
      impactWeight: 0.6,
    };

    const result = calculatePriorityScoreForIssue(input);

    expect(result.issueId).toBe('issue-001');
    expect(result.priorityScore).toBe(77);
    expect(result.priorityRank).toBe('HIGH');
    expect(result.colorCode).toBe('RED');
  });
});