import { determineDashboardAccessControl } from '../../src/logic/manager-dashboard';
import { type DashboardAccessControlInput, type DashboardAccessControlOutput } from '../../src/logic/manager-dashboard';

describe('課題の優先度を色分けで表示するダッシュボード機能', () => {
  // SCEN-976: [normal] ダッシュボード権限判定機能 - 開発部長がログイン時に課題優先度の編集が可能と判定される
  test('開発部長ユーザーがダッシュボードにアクセスしたとき、課題優先度編集権限が付与されること', () => {
    // Arrange
    const input: DashboardAccessControlInput = {
      userId: 'user-001-manager',
      userRole: 'manager',
      userTeamId: 'team-dev-001',
      requestedAccessLevel: 'team_only'
    };

    // Act
    const output: DashboardAccessControlOutput = determineDashboardAccessControl(input);

    // Assert
    expect(output.isAccessGranted).toBe(true);
    expect(output.grantedAccessLevel).toBe('team_only');
    expect(output.visibleDataScope.canViewTeamData).toBe(true);
    expect(output.visibleDataScope.canViewAllTeams).toBe(false);
    expect(output.visibleDataScope.canViewSelfDataOnly).toBe(false);
    expect(output.visibleDataScope.allowedTeamIds).toContain('team-dev-001');
    expect(output.editableFeatures.canEditIssuePriority).toBe(true);
    expect(output.editableFeatures.canEditChallengeStatus).toBe(true);
    expect(output.editableFeatures.canSendReminders).toBe(true);
    expect(output.editableFeatures.canExportReports).toBe(true);
    expect(output.denialReason).toBeNull();
  });
});