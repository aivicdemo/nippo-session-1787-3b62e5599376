import { describe, test, expect } from '@jest/globals';
import { determineDashboardAccessControl } from '../../src/logic/manager-dashboard';
import type { DashboardAccessControlInput, DashboardAccessControlOutput } from '../../src/logic/manager-dashboard';

describe('課題の影響度（チーム全体への波及度）を判定し、優先度スコアで順序付けして表示する機能', () => {
  // SCEN-989
  test('[error] ダッシュボード権限判定機能 - 開発エンジニア権限を持つユーザーが課題優先度編集操作を試みたときエラーになる', () => {
    const input: DashboardAccessControlInput = {
      userId: 'user-engineer-001',
      userRole: 'engineer',
      userTeamId: 'team-dev-001',
      requestedAccessLevel: 'self_only',
    };

    expect(() => {
      determineDashboardAccessControl(input);
    }).toThrow(/権限/);
  });
});