import { describe, test, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度スコア計算機能 - 過去30日間の課題発生履歴による優先度判定', () => {
  // SCEN-608
  test('過去30日間の課題発生履歴がない課題は低いスコアが算出される', () => {
    const currentDate = new Date('2024-06-15T10:00:00Z');
    const thirtyOneDaysAgo = new Date('2024-05-15T10:00:00Z');

    const issueWithNoRecentHistory = {
      issueId: 'ISSUE-001',
      issueContent: 'データベース接続タイムアウト',
      occurrenceFrequency: 0,
      impactScore: 50,
      affectedTeamCount: 2,
      resolutionDaysAverage: 2,
      reportingDate: thirtyOneDaysAgo.toISOString(),
      teamId: 'TEAM-A'
    };

    const issueWithRecentHistory = {
      issueId: 'ISSUE-002',
      issueContent: 'メモリリーク検出',
      occurrenceFrequency: 3,
      impactScore: 75,
      affectedTeamCount: 4,
      resolutionDaysAverage: 3,
      reportingDate: new Date('2024-06-10T10:00:00Z').toISOString(),
      teamId: 'TEAM-A'
    };

    const result001 = calculateIssuePriorityScore(issueWithNoRecentHistory);
    const result002 = calculateIssuePriorityScore(issueWithRecentHistory);

    expect(result001.priorityScore).toBeGreaterThanOrEqual(0);
    expect(result001.priorityScore).toBeLessThanOrEqual(30);
    expect(result001.issueId).toBe('ISSUE-001');
    expect(result001.priorityRank).toBe('低');
    expect(result001.colorCode).toBe('#00FF00');

    expect(result002.priorityScore).toBeGreaterThan(result001.priorityScore);
    expect(result002.priorityScore).toBeGreaterThanOrEqual(60);
    expect(result002.issueId).toBe('ISSUE-002');
    expect(result002.priorityRank).toBe('高');
    expect(result002.colorCode).toBe('#FF0000');

    expect(result001.scoreBreakdown.frequencyScore).toBe(0);
    expect(result002.scoreBreakdown.frequencyScore).toBeGreaterThan(0);
  });
});