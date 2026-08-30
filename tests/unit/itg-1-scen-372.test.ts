import { calculatePriorityScoreForIssue } from '../../src/logic/priority-scoring-engine';

describe('Priority Scoring Engine - calculatePriorityScoreForIssue', () => {
  // SCEN-372: [error] 影響を受けるメンバー数がチーム全体を超えるときにエラーをスロー
  test('should throw error when affected member count exceeds team size', () => {
    const input = {
      issueId: 'ISSUE-001',
      frequency: 50,
      impactScore: 75,
      frequencyWeight: 0.4,
      impactWeight: 0.6,
      affectedMemberCount: 11,
      teamSize: 10,
    };

    expect(() => calculatePriorityScoreForIssue(input)).toThrow(/メンバー数/);
  });
});