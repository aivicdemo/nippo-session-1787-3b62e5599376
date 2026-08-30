import { calculatePriorityScoreForIssue } from '../../src/logic/priority-scoring-engine';

describe('Priority Scoring Engine - Issue Priority Calculation', () => {
  test('SCEN-266: throws InvalidIssueDataError when issueId is null', () => {
    const invalidInput = {
      issueId: null as any,
      frequency: 50,
      impactScore: 75,
    };

    expect(() => calculatePriorityScoreForIssue(invalidInput)).toThrow(/課題データが不完全です/);
  });
});