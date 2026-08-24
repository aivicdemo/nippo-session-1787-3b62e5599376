import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度（チーム全体への波及度）を判定し、優先度スコアで順序付けして表示する機能', () => {
  // SCEN-2182: [edge] 課題優先度スコア算出機能 - 影響度スコアが下限直上（1）の課題は下限値より高い優先度で順序付けされる
  test('影響度スコア1の課題が影響度スコア0の課題より優先度スコアが高く、ソート後の配列内で前方に位置する', () => {
    const issueWithImpactScore1 = {
      issueId: 'ISSUE-001',
      issueContent: 'テスト課題',
      occurrenceFrequency: 5,
      impactScore: 1,
      affectedTeamCount: 2,
      resolutionDaysAverage: 3,
      reportingDate: '2024-01-15T10:00:00Z',
      teamId: 'TEAM-001',
    };

    const issueWithImpactScore0 = {
      issueId: 'ISSUE-002',
      issueContent: '下限課題',
      occurrenceFrequency: 5,
      impactScore: 0,
      affectedTeamCount: 2,
      resolutionDaysAverage: 3,
      reportingDate: '2024-01-15T10:00:00Z',
      teamId: 'TEAM-001',
    };

    const result1 = calculateIssuePriorityScore(issueWithImpactScore1);
    const result0 = calculateIssuePriorityScore(issueWithImpactScore0);

    expect(result1.priorityScore).toBeGreaterThan(result0.priorityScore);
    expect(result1.issueId).toBe('ISSUE-001');
    expect(result0.issueId).toBe('ISSUE-002');

    const sortedResults = [result1, result0].sort(
      (a, b) => b.priorityScore - a.priorityScore
    );

    expect(sortedResults[0].issueId).toBe('ISSUE-001');
    expect(sortedResults[1].issueId).toBe('ISSUE-002');
  });
});