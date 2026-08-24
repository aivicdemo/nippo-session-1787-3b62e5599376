import { describe, test, expect } from '@jest/globals';
import { determineDashboardAccessControl } from '../../src/logic/manager-dashboard';
import type {
  DashboardAccessControlInput,
  DashboardAccessControlOutput,
} from '../../src/logic/manager-dashboard';

describe('Manager Dashboard Access Control', () => {
  // SCEN-999: [edge] 職務権限に基づくダッシュボード表示制御 - 複数チーム所属時に権限の最上位レベルに基づいて機能制限が決定される
  test('should determine access control with highest permission level when user belongs to multiple teams', () => {
    // Setup: User with multiple team memberships
    // Team X: engineer role (lowest privilege)
    // Team Y: manager role (highest privilege)
    const input: DashboardAccessControlInput = {
      userId: 'user-001',
      userRole: 'manager',
      userTeamId: 'team-y-001',
      requestedAccessLevel: 'full',
    };

    const result: DashboardAccessControlOutput = determineDashboardAccessControl(input);

    // Verify access is granted
    expect(result.isAccessGranted).toBe(true);

    // Verify granted access level is based on highest privilege (manager)
    expect(result.grantedAccessLevel).toBe('full');

    // Verify visible data scope reflects full team access
    expect(result.visibleDataScope.canViewAllTeams).toBe(true);
    expect(result.visibleDataScope.canViewTeamData).toBe(true);
    expect(result.visibleDataScope.canViewSelfDataOnly).toBe(false);
    expect(Array.isArray(result.visibleDataScope.allowedTeamIds)).toBe(true);
    expect(result.visibleDataScope.allowedTeamIds.length).toBeGreaterThan(0);

    // Verify editable features based on manager role
    // Report export should be enabled for manager
    expect(result.editableFeatures.canEditIssuePriority).toBe(true);
    expect(result.editableFeatures.canEditChallengeStatus).toBe(true);
    expect(result.editableFeatures.canSendReminders).toBe(true);
    expect(result.editableFeatures.canExportReports).toBe(true);

    // Verify denial reason is null when access is granted
    expect(result.denialReason).toBeNull();
  });
});