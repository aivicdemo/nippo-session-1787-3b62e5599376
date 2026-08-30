import { calculatePriorityScoreForIssue } from '../../src/logic/priority-scoring-engine';

describe('Priority Scoring Engine', () => {
  test('SCEN-055: should throw InvalidIssueDataError when required fields are missing', () => {
    const incompleteInput = {
      issueId: 'issue-001',
      frequency: undefined,
      impactScore: undefined,
    };

    expect(() => calculatePriorityScoreForIssue(incompleteInput as any)).toThrow(
      /課題データが不完全です。発生頻度と影響度スコアが必須です。/
    );
  });
});