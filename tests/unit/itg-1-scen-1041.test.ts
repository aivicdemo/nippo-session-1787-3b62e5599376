import { ensureDashboardDataFreshness } from '../../src/logic/manager-dashboard';

describe('ダッシュボードデータ更新機能', () => {
  // SCEN-1041
  test('ユーザーIDが空文字列のとき、更新処理がエラーになる', async () => {
    const input = {
      userId: '',
      teamId: 'team-001',
      reportDate: '2024-01-15',
      maxStalenessSeconds: 300,
    };

    await expect(ensureDashboardDataFreshness(input)).rejects.toThrow(/ユーザーID/);
  });
});