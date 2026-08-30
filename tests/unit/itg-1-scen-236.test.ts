import { calculatePriorityScoreForIssue } from '../../src/logic/priority-scoring-engine';
import { type IssuePriorityScoringInput } from '../../src/logic/priority-scoring-engine';

describe('Priority Scoring Engine', () => {
  test('SCEN-236: calculatePriorityScoreForIssue throws error when impactScore exceeds valid range', () => {
    const input: IssuePriorityScoringInput = {
      issueId: 'ISSUE-001',
      frequency: 50,
      impactScore: 120,
      frequencyWeight: 0.4,
      impactWeight: 0.6,
    };

    expect(() => calculatePriorityScoreForIssue(input)).toThrow(/影響度スコア/);
  });
});