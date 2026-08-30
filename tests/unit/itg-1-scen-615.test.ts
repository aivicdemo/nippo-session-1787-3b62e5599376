import { prepareDashboardData } from '../../src/logic/dashboard-presentation';
import { type DashboardDisplayData } from '../../src/logic/dashboard-presentation';

describe('朝会報告管理システム - ダッシュボード表示データ集計', () => {
  // SCEN-615: [edge] 報告リストが空のときのダッシュボード表示データ集計
  test('報告リストが空のとき、空のデータ構造を返す', async () => {
    const testTeamId = 'team-001';
    const testDate = new Date('2024-01-15T09:00:00Z');
    const requestingUserId = 'user-manager-001';

    const result: DashboardDisplayData = await prepareDashboardData({
      teamId: testTeamId,
      targetDate: testDate,
      requestingUserId: requestingUserId,
      includeHistoricalTrend: false,
    });

    expect(result).toBeDefined();
    expect(result.submissionStatusSummary).toBeDefined();
    expect(result.submissionStatusSummary.submittedCount).toBe(0);
    expect(result.submissionStatusSummary.totalTeamMembers).toBeGreaterThanOrEqual(0);
    expect(result.unsubmittedMembers).toEqual([]);
    expect(result.prioritizedIssueList).toEqual([]);
    expect(result.issueKeywordRanking).toEqual([]);
    expect(result.lastUpdatedAt).toBeInstanceOf(Date);
    expect(result.lastUpdatedAt.getTime()).toBeLessThanOrEqual(new Date().getTime() + 1000);
  });
});