import { calculatePriorityScoreForIssue } from '../../src/logic/priority-scoring-engine';

describe('Priority Scoring Engine - calculatePriorityScoreForIssue', () => {
  test('SCEN-335: should throw error when issue keyword is empty string', () => {
    const issueKeyword = '';
    const input = {
      issueId: 'ISSUE-001',
      frequency: 50,
      impactScore: 75,
      frequencyWeight: 0.4,
      impactWeight: 0.6,
    };

    expect(() => calculatePriorityScoreForIssue(issueKeyword, input)).toThrow(/課題キーワード/);
  });
});