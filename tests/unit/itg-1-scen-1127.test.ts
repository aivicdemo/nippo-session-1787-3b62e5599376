import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題の優先度スコア算出機能', () => {
  // SCEN-1127
  test('同じ入力で複数回実行した場合、毎回同じ優先度スコアが返される', () => {
    const issueInput = {
      issueId: 'issue-001',
      issueContent: 'サーバーダウン',
      occurrenceFrequency: 5,
      impactScore: 85,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15T09:00:00Z',
      teamId: 'team-001',
    };

    const firstResult = calculateIssuePriorityScore(issueInput);
    const secondResult = calculateIssuePriorityScore(issueInput);
    const thirdResult = calculateIssuePriorityScore(issueInput);

    expect(firstResult.priorityScore).toBe(90);
    expect(secondResult.priorityScore).toBe(90);
    expect(thirdResult.priorityScore).toBe(90);
    expect(firstResult.priorityScore).toBe(secondResult.priorityScore);
    expect(secondResult.priorityScore).toBe(thirdResult.priorityScore);
  });
});