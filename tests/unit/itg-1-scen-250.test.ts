import { describe, test, expect } from '@jest/globals';
import { calculatePriorityScoreForIssue } from '../../src/logic/priority-scoring-engine';

describe('Priority Scoring Engine', () => {
  test('SCEN-250: calculatePriorityScoreForIssue throws InvalidIssueDataError when issue data is incomplete', () => {
    const invalidInput = {
      issueId: '',
      frequency: 45,
      impactScore: 60,
    };

    expect(() => calculatePriorityScoreForIssue(invalidInput)).toThrow(/課題データが不完全です/);
  });
});