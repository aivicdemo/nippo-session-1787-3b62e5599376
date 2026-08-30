import { calculatePriorityScoreForIssue } from '../../src/logic/priority-scoring-engine';

describe('Priority Scoring Engine', () => {
  // SCEN-336
  test('should calculate priority score with default weights and return MEDIUM rank with YELLOW color', () => {
    const input = {
      issueId: 'ISSUE-001',
      frequency: 45,
      impactScore: 60,
    };

    const result = calculatePriorityScoreForIssue(input);

    expect(result.issueId).toBe('ISSUE-001');
    expect(result.priorityScore).toBe(54);
    expect(result.priorityRank).toBe('MEDIUM');
    expect(result.colorCode).toBe('YELLOW');
  });
});