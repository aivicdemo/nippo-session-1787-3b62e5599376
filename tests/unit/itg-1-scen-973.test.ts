import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { determineDashboardAccessControl } from '../../src/logic/manager-dashboard';

describe('Manager Dashboard Access Control', () => {
  // SCEN-973
  test('should display only self data for engineer user when accessing dashboard', () => {
    // Setup: Engineer user context
    const engineerUserContext = {
      userId: 'engineer-001',
      userRole: 'engineer',
      teamId: 'team-A',
    };

    // Request access for self_only level
    const accessInput = {
      userId: engineerUserContext.userId,
      userRole: engineerUserContext.userRole as 'manager' | 'pm' | 'engineer' | 'executive',
      userTeamId: engineerUserContext.teamId,
      requestedAccessLevel: 'self_only' as const,
    };

    // Execute
    const result = determineDashboardAccessControl(accessInput);

    // Assert: Access is granted at self_only level
    expect(result.isAccessGranted).toBe(true);
    expect(result.grantedAccessLevel).toBe('self_only');

    // Assert: Only self data is visible
    expect(result.visibleDataScope.canViewAllTeams).toBe(false);
    expect(result.visibleDataScope.canViewTeamData).toBe(false);
    expect(result.visibleDataScope.canViewSelfDataOnly).toBe(true);
    expect(result.visibleDataScope.allowedTeamIds).toEqual([]);

    // Assert: Engineer can only view, not edit
    expect(result.editableFeatures.canEditIssuePriority).toBe(false);
    expect(result.editableFeatures.canEditChallengeStatus).toBe(false);
    expect(result.editableFeatures.canSendReminders).toBe(false);
    expect(result.editableFeatures.canExportReports).toBe(false);

    // Assert: No denial reason for valid engineer access
    expect(result.denialReason).toBeNull();
  });
});