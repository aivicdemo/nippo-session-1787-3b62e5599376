import { determineDashboardAccessControl } from '../../src/logic/manager-dashboard';
import { type DashboardAccessControlInput, type DashboardAccessControlOutput } from '../../src/logic/manager-dashboard';

describe('Manager Dashboard Access Control - Permission Boundary Verification', () => {
  // SCEN-993: [edge] 職務権限に基づくダッシュボード表示制御 - 部長権限ユーザーが全チーム進捗データへのアクセス権を持つちょうど境界値
  test('should grant full team access to manager role users at permission level 3 boundary', () => {
    // Setup: Manager role user (permission level 3) at the boundary
    const manager_user_input: DashboardAccessControlInput = {
      userId: 'user-manager-001',
      userRole: 'manager',
      userTeamId: 'team-001',
      requestedAccessLevel: 'full'
    };

    // Execute: Determine access control for manager user
    const manager_result: DashboardAccessControlOutput = determineDashboardAccessControl(manager_user_input);

    // Verify: Manager role (level 3) should have full access at boundary
    expect(manager_result.isAccessGranted).toBe(true);
    expect(manager_result.grantedAccessLevel).toBe('full');
    expect(manager_result.visibleDataScope.canViewAllTeams).toBe(true);
    expect(manager_result.visibleDataScope.canViewTeamData).toBe(true);
    expect(manager_result.visibleDataScope.canViewSelfDataOnly).toBe(false);
    expect(manager_result.visibleDataScope.allowedTeamIds).toEqual(['team-001', 'team-002', 'team-003']);
    expect(manager_result.editableFeatures.canEditIssuePriority).toBe(true);
    expect(manager_result.editableFeatures.canEditChallengeStatus).toBe(true);
    expect(manager_result.editableFeatures.canSendReminders).toBe(true);
    expect(manager_result.editableFeatures.canExportReports).toBe(true);
    expect(manager_result.denialReason).toBeNull();

    // Setup: PM role user (permission level 2, one level below manager) for comparison
    const pm_user_input: DashboardAccessControlInput = {
      userId: 'user-pm-001',
      userRole: 'pm',
      userTeamId: 'team-001',
      requestedAccessLevel: 'full'
    };

    // Execute: Determine access control for PM user
    const pm_result: DashboardAccessControlOutput = determineDashboardAccessControl(pm_user_input);

    // Verify: PM role (level 2) should NOT have full team access, demonstrating manager is the minimum required level
    expect(pm_result.isAccessGranted).toBe(true);
    expect(pm_result.grantedAccessLevel).toBe('team_only');
    expect(pm_result.visibleDataScope.canViewAllTeams).toBe(false);
    expect(pm_result.visibleDataScope.canViewTeamData).toBe(true);
    expect(pm_result.visibleDataScope.canViewSelfDataOnly).toBe(false);
    expect(pm_result.visibleDataScope.allowedTeamIds).toEqual(['team-001']);
    expect(pm_result.editableFeatures.canEditIssuePriority).toBe(true);
    expect(pm_result.editableFeatures.canEditChallengeStatus).toBe(false);
    expect(pm_result.editableFeatures.canSendReminders).toBe(true);
    expect(pm_result.editableFeatures.canExportReports).toBe(false);

    // Verify: Permission boundary - Manager (level 3) is the minimum level for full team access
    expect(manager_result.visibleDataScope.allowedTeamIds.length).toBe(3);
    expect(pm_result.visibleDataScope.allowedTeamIds.length).toBe(1);
    expect(manager_result.visibleDataScope.canViewAllTeams).not.toBe(pm_result.visibleDataScope.canViewAllTeams);
  });
});