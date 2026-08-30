import { calculatePriorityScoreForIssue } from '../../src/logic/priority-scoring-engine';

describe('Priority Scoring Engine', () => {
  // SCEN-497
  test('should throw error when countermeasures list is empty', () => {
    const countermeasures: Array<{ title: string; estimatedImpact: number; implementationDifficulty: number; requiredResources: number }> = [];
    const effectWeight = 0.5;
    const difficultyWeight = 0.3;
    const resourceWeight = 0.2;

    expect(() =>
      calculatePriorityScoreForIssue(
        countermeasures,
        effectWeight,
        difficultyWeight,
        resourceWeight
      )
    ).toThrow(/最低1件以上の対策案/);
  });
});