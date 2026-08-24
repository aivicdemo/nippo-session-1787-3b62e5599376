import { describe, test, expect } from '@jest/globals';
import { determineDashboardAccessControl } from '../../src/logic/manager-dashboard';

describe('課題の優先度を色分けで表示するダッシュボード機能', () => {
  // SCEN-984
  test('アクセス対象のチームIDがnullのときエラーになる', () => {
    const input = {
      userId: 'user-001',
      userRole: 'manager' as const,
      userTeamId: 'team-001',
      requestedAccessLevel: 'team_only' as const,
    };

    expect(() => {
      determineDashboardAccessControl({
        ...input,
        userTeamId: null as any,
      });
    }).toThrow(/teamId|チームID/i);
  });
});