import { describe, test, expect } from '@jest/globals';
import { ensureDashboardDataFreshness } from '../../src/logic/manager-dashboard';

describe('ダッシュボードデータ鮮度管理機能', () => {
  test('SCEN-1039: [error] 日報データが空配列のとき、更新処理がエラーになる', () => {
    const input = {
      userId: 'user-001',
      teamId: 'team-001',
      reportDate: '2024-01-15',
      maxStalenessSeconds: 300,
      reportData: [],
    };

    expect(() => ensureDashboardDataFreshness(input)).toThrow(/日報データ|empty|undefined/);
  });
});