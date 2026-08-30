import { prepareDashboardData, type DashboardDataPrepareInput, type DashboardDisplayData } from '../../src/logic/dashboard-presentation';

describe('朝会報告管理システム - ダッシュボード表示', () => {
  // SCEN-618: [edge] 優先度スコアが0～100の範囲外のとき、正規化されることを検証
  test('prepareDashboardData は優先度スコアを0～100の範囲に正規化する', () => {
    const requestingUserId = 'user-manager-001';
    const teamId = 'team-dev-001';
    const targetDate = new Date('2024-01-15T09:00:00Z');

    const input: DashboardDataPrepareInput = {
      teamId,
      targetDate,
      requestingUserId,
      includeHistoricalTrend: false,
    };

    const result: DashboardDisplayData = prepareDashboardData(input);

    expect(result).toBeDefined();
    expect(result.prioritizedIssueList).toBeDefined();
    expect(Array.isArray(result.prioritizedIssueList)).toBe(true);

    // すべての課題の優先度スコアが0～100の範囲内であることを検証
    result.prioritizedIssueList.forEach((issue) => {
      expect(typeof issue.priorityScore).toBe('number');
      expect(issue.priorityScore).toBeGreaterThanOrEqual(0);
      expect(issue.priorityScore).toBeLessThanOrEqual(100);
    });

    expect(result.submissionStatusSummary).toBeDefined();
    expect(result.unsubmittedMembers).toBeDefined();
    expect(Array.isArray(result.unsubmittedMembers)).toBe(true);
    expect(result.issueKeywordRanking).toBeDefined();
    expect(Array.isArray(result.issueKeywordRanking)).toBe(true);

    expect(result.lastUpdatedAt).toBeInstanceOf(Date);
    expect(result.lastUpdatedAt.getTime()).toBeLessThanOrEqual(new Date().getTime());
  });
});