import { ensureDashboardDataFreshness } from '../../src/logic/manager-dashboard';

describe('朝会報告管理システム - ダッシュボードデータ鮮度保証', () => {
  // SCEN-2119
  test('古いデータ自動削除機能 - 削除対象データの保持期間が空文字列のとき、バリデーションエラーが発生する', () => {
    const input = {
      userId: 'user-001',
      teamId: 'team-001',
      reportDate: '2024-01-15',
      maxStalenessSeconds: 300,
      retentionDays: '',
    };

    expect(() => ensureDashboardDataFreshness(input)).toThrow(/保持期間/);
  });
});