import { ensureDashboardDataFreshness } from '../../src/logic/manager-dashboard';
import { type DashboardDataFreshnessInput, type DashboardDataFreshnessOutput } from '../../src/logic/manager-dashboard';

describe('ダッシュボード更新機能 - ユーザーID検証', () => {
  // SCEN-1040
  test('ユーザーIDがnullのとき、更新処理がエラーになり「ユーザーIDが指定されていません」と明示される', () => {
    const input: DashboardDataFreshnessInput = {
      userId: null as any,
      teamId: 'team-001',
      reportDate: '2024-01-15',
      maxStalenessSeconds: 300,
    };

    expect(() => ensureDashboardDataFreshness(input)).toThrow(/ユーザーID/);
  });
});