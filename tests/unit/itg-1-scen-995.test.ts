import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { determineDashboardAccessControl } from '../../src/logic/manager-dashboard';
import type { DashboardAccessControlInput, DashboardAccessControlOutput } from '../../src/logic/manager-dashboard';

// SCEN-995: [edge] 職務権限に基づくダッシュボード表示制御 - 管理者権限が部長権限の上位境界
describe('Dashboard Access Control - Administrator Permission Boundary', () => {
  test('should grant full access to all teams for admin role user while director role is restricted', () => {
    // Arrange
    const adminUserContext: DashboardAccessControlInput = {
      userId: 'admin-user-001',
      userRole: 'executive',
      userTeamId: 'admin-team-000',
      requestedAccessLevel: 'full'
    };

    const directorUserContext: DashboardAccessControlInput = {
      userId: 'director-user-002',
      userRole: 'manager',
      userTeamId: 'team-x-001',
      requestedAccessLevel: 'full'
    };

    // Act - Test admin user access
    const adminAccessResult: DashboardAccessControlOutput = determineDashboardAccessControl(adminUserContext);

    // Assert - Admin should have full access to all teams
    expect(adminAccessResult.isAccessGranted).toBe(true);
    expect(adminAccessResult.grantedAccessLevel).toBe('full');
    expect(adminAccessResult.visibleDataScope.canViewAllTeams).toBe(true);
    expect(adminAccessResult.visibleDataScope.canViewTeamData).toBe(true);
    expect(adminAccessResult.visibleDataScope.canViewSelfDataOnly).toBe(false);
    expect(Array.isArray(adminAccessResult.visibleDataScope.allowedTeamIds)).toBe(true);
    expect(adminAccessResult.visibleDataScope.allowedTeamIds.length).toBeGreaterThan(0);
    expect(adminAccessResult.editableFeatures.canEditIssuePriority).toBe(true);
    expect(adminAccessResult.editableFeatures.canEditChallengeStatus).toBe(true);
    expect(adminAccessResult.editableFeatures.canSendReminders).toBe(true);
    expect(adminAccessResult.editableFeatures.canExportReports).toBe(true);
    expect(adminAccessResult.denialReason).toBeNull();

    // Act - Test director user access for same full level request
    const directorAccessResult: DashboardAccessControlOutput = determineDashboardAccessControl(directorUserContext);

    // Assert - Director should be restricted to team_only level, not full
    expect(directorAccessResult.isAccessGranted).toBe(true);
    expect(directorAccessResult.grantedAccessLevel).toBe('team_only');
    expect(directorAccessResult.visibleDataScope.canViewAllTeams).toBe(false);
    expect(directorAccessResult.visibleDataScope.canViewTeamData).toBe(true);
    expect(directorAccessResult.visibleDataScope.canViewSelfDataOnly).toBe(false);
    expect(directorAccessResult.visibleDataScope.allowedTeamIds).toContain('team-x-001');
    expect(directorAccessResult.editableFeatures.canEditIssuePriority).toBe(true);
    expect(directorAccessResult.editableFeatures.canEditChallengeStatus).toBe(true);
    expect(directorAccessResult.editableFeatures.canSendReminders).toBe(true);
    expect(directorAccessResult.editableFeatures.canExportReports).toBe(false);
    expect(directorAccessResult.denialReason).toBeNull();

    // Assert - Verify admin boundary is superior to director
    expect(adminAccessResult.grantedAccessLevel).not.toEqual(directorAccessResult.grantedAccessLevel);
    expect(adminAccessResult.visibleDataScope.canViewAllTeams).toBe(true);
    expect(directorAccessResult.visibleDataScope.canViewAllTeams).toBe(false);
  });
});