import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定機能', () => {
  test('SCEN-1658: 波及度スコアが50（中位境界値）の場合、中優先度に分類される', () => {
    const input = {
      issueId: 'issue-001',
      issueContent: 'Database connection timeout during peak hours',
      occurrenceFrequency: 5,
      impactScore: 50,
      affectedTeamCount: 2,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: 'team-001',
    };

    const result = calculateIssuePriorityScore(input);

    expect(result.issueId).toBe('issue-001');
    expect(result.priorityRank).toBe('中');
    expect(result.priorityScore).toBe(50);
    expect(result.scoreBreakdown).toBeDefined();
    expect(result.scoreBreakdown.impactScore).toBe(20);
    expect(result.colorCode).toBe('#FFFF00');
  });
});