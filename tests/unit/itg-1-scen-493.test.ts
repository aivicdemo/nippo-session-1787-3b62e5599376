import { calculatePriorityScoreForIssue } from '../../src/logic/priority-scoring-engine';
import type { IssuePriorityScoringInput, IssuePriorityScore } from '../../src/logic/priority-scoring-engine';

jest.mock('../../src/logic/priority-scoring-engine', () => {
  const actualModule = jest.requireActual('../../src/logic/priority-scoring-engine');
  return {
    ...actualModule,
    determinePriorityRankFromScore: jest.fn((score: number) => {
      if (score >= 70) return 'HIGH';
      if (score >= 40) return 'MEDIUM';
      return 'LOW';
    }),
    getColorCodeForRank: jest.fn((rank: string) => {
      const rankToColor: Record<string, string> = {
        'HIGH': 'RED',
        'MEDIUM': 'YELLOW',
        'LOW': 'GREEN',
      };
      return rankToColor[rank];
    }),
    judgeAccessPermission: jest.fn(() => true),
  };
});

describe('Priority Scoring Engine', () => {
  test('SCEN-493: calculatePriorityScoreForIssue returns correct priority score and rank based on frequency and impact', () => {
    // Arrange
    const input: IssuePriorityScoringInput = {
      issueId: 'ISSUE-001',
      frequency: 40,
      impactScore: 60,
      frequencyWeight: 0.4,
      impactWeight: 0.6,
    };

    // Expected calculation: (40 * 0.4) + (60 * 0.6) = 16 + 36 = 52
    const expectedPriorityScore = 52;
    // Score 52 falls in MEDIUM range (40 <= 52 < 70)
    const expectedPriorityRank = 'MEDIUM';
    const expectedColorCode = 'YELLOW';

    // Act
    const result: IssuePriorityScore = calculatePriorityScoreForIssue(input);

    // Assert
    expect(result.issueId).toBe('ISSUE-001');
    expect(result.priorityScore).toBe(expectedPriorityScore);
    expect(result.priorityRank).toBe(expectedPriorityRank);
    expect(result.colorCode).toBe(expectedColorCode);
  });
});