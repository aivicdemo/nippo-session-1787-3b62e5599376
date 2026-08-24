import { describe, test, expect } from '@jest/globals';
import { determineDashboardAccessControl } from '../../src/logic/manager-dashboard';

describe('ダッシュボード権限判定機能', () => {
  // SCEN-981
  test('ユーザーが所属するチームが空配列のときエラーになる', () => {
    const input = {
      userId: 'user-001',
      userRole: 'manager' as const,
      userTeamId: '',
      requestedAccessLevel: 'full' as const,
    };

    expect(() => determineDashboardAccessControl(input)).toThrow(/チーム|所属|割り当て/);
  });
});