import { ensureDashboardDataFreshness } from '../../src/logic/manager-dashboard';

describe('ダッシュボードデータ更新機能 - チームID検証', () => {
  // SCEN-1043
  test('チームIDが空文字列のとき、エラーが発生すること', () => {
    const input = {
      userId: 'user-001',
      teamId: '',
      reportDate: '2024-01-15',
      maxStalenessSeconds: 300,
    };

    expect(() => ensureDashboardDataFreshness(input)).toThrow(/teamId|チームID/);
  });
});