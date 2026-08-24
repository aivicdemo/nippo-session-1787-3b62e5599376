import { describe, test, expect } from '@jest/globals';
import { determineDashboardAccessControl } from '../../src/logic/manager-dashboard';

describe('課題の優先度を色分けで表示するダッシュボード機能', () => {
  // SCEN-980
  test('ユーザーが所属するチームが null のときエラーになる', () => {
    const userContextWithNullTeam = {
      userId: 'user-001',
      userRole: 'manager',
      teamId: null as any,
    };

    const input: DashboardAccessControlInput = {
      userId: userContextWithNullTeam.userId,
      userRole: 'manager',
      userTeamId: userContextWithNullTeam.teamId,
      requestedAccessLevel: 'team_only',
    };

    expect(() => determineDashboardAccessControl(input)).toThrow(/チーム/);
  });
});

interface DashboardAccessControlInput {
  userId: string;
  userRole: 'manager' | 'pm' | 'engineer' | 'executive';
  userTeamId: string | null;
  requestedAccessLevel: 'full' | 'team_only' | 'self_only';
}