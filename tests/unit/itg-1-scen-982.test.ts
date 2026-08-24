import { describe, test, expect } from '@jest/globals';
import { determineDashboardAccessControl } from '../../src/logic/manager-dashboard';

describe('ダッシュボード権限判定機能', () => {
  // SCEN-982
  test('[error] ユーザーIDがnullのときエラーになる', () => {
    const invalidInput = {
      userId: null as any,
      userRole: 'manager' as const,
      userTeamId: 'team-001',
      requestedAccessLevel: 'full' as const,
    };

    expect(() => determineDashboardAccessControl(invalidInput)).toThrow(/ユーザーID/);
  });
});