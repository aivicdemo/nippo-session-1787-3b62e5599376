import { calculatePriorityScoreForIssue } from '../../src/logic/priority-scoring-engine';

describe('Priority Scoring Engine', () => {
  // SCEN-333
  test('should throw error when occurrence count is negative', () => {
    const issueKeyword = 'ビルドエラー';
    const occurrenceCount = -1;
    const affectedMemberCount = 3;
    const teamSize = 10;
    const issueCategory = 'technical_failure';

    expect(() =>
      calculatePriorityScoreForIssue(
        issueKeyword,
        occurrenceCount,
        affectedMemberCount,
        teamSize,
        issueCategory
      )
    ).toThrow(/発生回数/);
  });
});