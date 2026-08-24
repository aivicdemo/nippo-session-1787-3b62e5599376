import { describe, test, expect } from '@jest/globals';
import { determineDashboardAccessControl } from '../../src/logic/manager-dashboard';

describe('課題の優先度を色分けで表示するダッシュボード機能', () => {
  // SCEN-974: [normal] ダッシュボード権限判定機能 - 開発エンジニアがログイン時に課題優先度の参照のみ可能と判定される
  test('開発エンジニアロールでログイン時にダッシュボード表示で課題優先度セクションの権限が参照のみと判定される', () => {
    const input: DashboardAccessControlInput = {
      userId: 'dev-engineer-001',
      userRole: 'engineer',
      userTeamId: 'team-backend-001',
      requestedAccessLevel: 'team_only',
    };

    const result = determineDashboardAccessControl(input);

    expect(result.isAccessGranted).toBe(true);
    expect(result.grantedAccessLevel).toBe('team_only');
    expect(result.visibleDataScope).toEqual({
      canViewAllTeams: false,
      canViewTeamData: true,
      canViewSelfDataOnly: false,
      allowedTeamIds: ['team-backend-001'],
    });
    expect(result.editableFeatures).toEqual({
      canEditIssuePriority: false,
      canEditChallengeStatus: false,
      canSendReminders: false,
      canExportReports: false,
    });
    expect(result.denialReason).toBeNull();
  });
});

interface DashboardAccessControlInput {
  userId: string;
  userRole: 'manager' | 'pm' | 'engineer' | 'executive';
  userTeamId: string;
  requestedAccessLevel: 'full' | 'team_only' | 'self_only';
}

interface DashboardAccessControlOutput {
  isAccessGranted: boolean;
  grantedAccessLevel: 'full' | 'team_only' | 'self_only';
  visibleDataScope: {
    canViewAllTeams: boolean;
    canViewTeamData: boolean;
    canViewSelfDataOnly: boolean;
    allowedTeamIds: string[];
  };
  editableFeatures: {
    canEditIssuePriority: boolean;
    canEditChallengeStatus: boolean;
    canSendReminders: boolean;
    canExportReports: boolean;
  };
  denialReason: string | null;
}