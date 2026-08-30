import { prepareDashboardData } from '../../src/logic/dashboard-presentation';
import { type DashboardDataPrepareInput } from '../../src/logic/dashboard-presentation';

describe('朝会報告管理システム - ダッシュボード表示準備', () => {
  // SCEN-368: [error] 現在のユーザーIDが無効または存在しない場合、ユーザー認証に失敗
  test('requestingUserIdが存在しない場合、ユーザー認証エラーをスロー', async () => {
    const input: DashboardDataPrepareInput = {
      teamId: 'team-001',
      targetDate: new Date('2026-08-19'),
      requestingUserId: 'invalid-user-id-12345',
      includeHistoricalTrend: false,
    };

    await expect(() => prepareDashboardData(input)).rejects.toThrow(/ユーザー認証/);
  });
});