import { describe, test, expect } from '@jest/globals';
import { determineDashboardAccessControl } from '../../src/logic/manager-dashboard';

describe('ダッシュボード権限判定機能', () => {
  test('SCEN-991: セッション情報が null のときエラーが発生する', () => {
    const input = {
      userId: null as unknown as string,
      userRole: 'manager' as const,
      teamId: 'team-001',
      requestedAccessLevel: 'full' as const,
    };

    expect(() => {
      determineDashboardAccessControl(input);
    }).toThrow(/セッション/);
  });
});