import { ensureDashboardDataFreshness } from '../../src/logic/manager-dashboard';

describe('ダッシュボードデータ更新機能 - ユーザー権限検証', () => {
  // SCEN-1044
  test('開発エンジニア・開発部長以外のユーザーがダッシュボードデータ更新を試みた場合、403エラーと権限エラーメッセージが返却される', () => {
    const input = {
      userId: 'user-sales-001',
      userRole: 'sales',
      teamId: 'team-dev-001',
      reportDate: '2024-01-15',
      maxStalenessSeconds: 300,
    };

    expect(() => ensureDashboardDataFreshness(input)).toThrow(/権限/);
  });
});