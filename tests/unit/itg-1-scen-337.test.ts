import { calculatePriorityScoreForIssue } from '../../src/logic/priority-scoring-engine';

describe('Priority Scoring Engine', () => {
  test('SCEN-337: calculate priority score with frequency and impact score, returning HIGH rank and RED color', () => {
    const issueId = 'ISSUE-001';
    const frequency = 50;
    const impactScore = 60;
    const frequencyWeight = 0.4;
    const impactWeight = 0.6;

    const result = calculatePriorityScoreForIssue({
      issueId,
      frequency,
      impactScore,
      frequencyWeight,
      impactWeight,
    });

    const expectedPriorityScore = frequencyWeight * frequency + impactWeight * impactScore;

    expect(result).toEqual({
      issueId: 'ISSUE-001',
      priorityScore: expectedPriorityScore,
      priorityRank: 'HIGH',
      colorCode: 'RED',
    });
    expect(result.priorityScore).toBe(56);
    expect(result.issueId).toBe('ISSUE-001');
    expect(result.priorityRank).toBe('HIGH');
    expect(result.colorCode).toBe('RED');
  });
});