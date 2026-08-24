import { ensureDashboardDataFreshness } from '../../src/logic/manager-dashboard';

describe('朝会報告管理システム - ダッシュボードデータ鮮度管理', () => {
  // SCEN-2125: [error] 古いデータ自動削除機能 - 保持期間が0のとき、エラーが発生して処理が中断される
  test('should throw error when retention days is 0', () => {
    const input = {
      userId: 'user-001',
      teamId: 'team-001',
      reportDate: '2024-01-15',
      maxStalenessSeconds: 0,
    };

    expect(() => ensureDashboardDataFreshness(input)).toThrow(/保持期間/);
  });
});