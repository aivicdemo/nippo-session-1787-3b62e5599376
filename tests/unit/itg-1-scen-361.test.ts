import { prepareDashboardData } from '../../src/logic/dashboard-presentation';

describe('朝会報告管理システム - ダッシュボード表示データ準備', () => {
  // SCEN-361
  test('日報データベースアクセス失敗時にDataAggregationFailureErrorが発生すること', async () => {
    const teamId = 'team-001';
    const targetDate = new Date('2024-01-15T09:00:00Z');
    const requestingUserId = 'user-director-001';
    const includeHistoricalTrend = false;

    await expect(
      prepareDashboardData({
        teamId,
        targetDate,
        requestingUserId,
        includeHistoricalTrend,
      })
    ).rejects.toThrow(/ダッシュボードデータの集計に失敗しました/);
  });
});