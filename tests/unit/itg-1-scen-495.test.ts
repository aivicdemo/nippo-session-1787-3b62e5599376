import { calculatePriorityScoreForIssue } from '../../src/logic/priority-scoring-engine';

describe('Priority Scoring Engine', () => {
  // SCEN-495
  test('should clamp implementation difficulty to valid range [1-10] and calculate priority score correctly', () => {
    // Input: countermeasures with boundary difficulty values
    const countermeasures = [
      {
        id: 'measure-1',
        title: 'Implement automated testing',
        expectedEffect: 5,
        implementationDifficulty: 0.5, // Below minimum (1)
        requiredResources: 5,
      },
      {
        id: 'measure-2',
        title: 'Refactor legacy code',
        expectedEffect: 5,
        implementationDifficulty: 10.5, // Above maximum (10)
        requiredResources: 5,
      },
    ];

    const effectWeight = 0.5;
    const difficultyWeight = 0.3;
    const resourceWeight = 0.2;

    // Execute function
    const result = calculatePriorityScoreForIssue(
      countermeasures,
      effectWeight,
      difficultyWeight,
      resourceWeight
    );

    // Verify result is an array with 2 elements
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(2);

    // First measure: difficulty 0.5 → clamped to 1
    // difficultyScore = ((10 - 1) / 10) * 100 * 0.3 = (9 / 10) * 100 * 0.3 = 27
    // effectScore = (5 / 10) * 100 * 0.5 = 0.5 * 100 * 0.5 = 25
    // resourceScore = ((10 - 5) / 10) * 100 * 0.2 = (5 / 10) * 100 * 0.2 = 10
    // priorityScore = 27 + 25 + 10 = 62
    const firstResult = result[0];
    expect(firstResult.id).toBe('measure-1');
    expect(firstResult.title).toBe('Implement automated testing');
    expect(firstResult.priorityScore).toBe(62);
    expect(firstResult.rank).toBe(1);
    expect(firstResult.scoringBreakdown).toEqual({
      effectScore: 25,
      difficultyScore: 27,
      resourceScore: 10,
    });

    // Second measure: difficulty 10.5 → clamped to 10
    // difficultyScore = ((10 - 10) / 10) * 100 * 0.3 = (0 / 10) * 100 * 0.3 = 0
    // effectScore = (5 / 10) * 100 * 0.5 = 0.5 * 100 * 0.5 = 25
    // resourceScore = ((10 - 5) / 10) * 100 * 0.2 = (5 / 10) * 100 * 0.2 = 10
    // priorityScore = 0 + 25 + 10 = 35
    const secondResult = result[1];
    expect(secondResult.id).toBe('measure-2');
    expect(secondResult.title).toBe('Refactor legacy code');
    expect(secondResult.priorityScore).toBe(35);
    expect(secondResult.rank).toBe(2);
    expect(secondResult.scoringBreakdown).toEqual({
      effectScore: 25,
      difficultyScore: 0,
      resourceScore: 10,
    });
  });
});