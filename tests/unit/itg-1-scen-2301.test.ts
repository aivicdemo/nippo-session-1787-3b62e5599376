import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Priority Scoring - Impact Score Edge Case', () => {
  // SCEN-2301: [edge] 課題影響度判定機能 - チーム波及度スコアがちょうど 0 の場合、課題優先度が最低ランクとして計算される
  test('should calculate lowest priority rank when impact score is exactly 0', () => {
    const input = {
      issueId: 'issue-001',
      issueContent: 'Minor documentation typo',
      occurrenceFrequency: 1,
      impactScore: 0,
      affectedTeamCount: 0,
      resolutionDaysAverage: 0.5,
      reportingDate: '2024-01-15',
      teamId: 'team-dev-001',
    };

    const result = calculateIssuePriorityScore(input);

    expect(result.issueId).toBe('issue-001');
    expect(result.priorityScore).toBe(2);
    expect(result.priorityRank).toBe('低');
    expect(result.scoreBreakdown.frequencyScore).toBe(2);
    expect(result.scoreBreakdown.impactScore).toBe(0);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBe(0);
    expect(result.colorCode).toBe('#00FF00');
    expect(typeof result.calculatedAt).toBe('string');
  });
});