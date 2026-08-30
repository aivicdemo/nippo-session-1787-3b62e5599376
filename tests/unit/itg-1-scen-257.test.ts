import { calculatePriorityScoreForIssue } from '../../src/logic/priority-scoring-engine';

describe('Priority Scoring Engine - calculatePriorityScoreForIssue', () => {
  // SCEN-257: [error] チームサイズが0以下のとき
  test('should throw error when teamSize is 0 or less', () => {
    const invalidInput = {
      issueId: 'ISSUE-001',
      frequency: 50,
      impactScore: 75,
      teamSize: 0,
    };

    expect(() => calculatePriorityScoreForIssue(invalidInput)).toThrow(/チームサイズ/);
  });
});