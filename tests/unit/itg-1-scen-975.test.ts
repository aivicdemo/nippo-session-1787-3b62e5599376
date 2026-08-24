import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { determineDashboardAccessControl } from '../../src/logic/manager-dashboard';
import type { DashboardAccessControlInput, DashboardAccessControlOutput } from '../../src/logic/manager-dashboard';

describe('ダッシュボード権限判定機能 - 開発部長がログイン時に全チーム進捗が表示される', () => {
  // SCEN-975
  it('should grant full access to department lead and allow viewing all team data', () => {
    const departmentLeadInput: DashboardAccessControlInput = {
      userId: 'user-001-dept-lead',
      userRole: 'manager',
      userTeamId: 'team-dev-dept',
      requestedAccessLevel: 'full',
    };

    const result: DashboardAccessControlOutput = determineDashboardAccessControl(departmentLeadInput);

    expect(result.isAccessGranted).toBe(true);
    expect(result.grantedAccessLevel).toBe('full');
    expect(result.visibleDataScope.canViewAllTeams).toBe(true);
    expect(result.visibleDataScope.canViewTeamData).toBe(true);
    expect(result.visibleDataScope.canViewSelfDataOnly).toBe(false);
    expect(result.visibleDataScope.allowedTeamIds.length).toBeGreaterThan(0);
    expect(result.editableFeatures.canEditIssuePriority).toBe(true);
    expect(result.editableFeatures.canEditChallengeStatus).toBe(true);
    expect(result.editableFeatures.canSendReminders).toBe(true);
    expect(result.editableFeatures.canExportReports).toBe(true);
    expect(result.denialReason).toBeNull();
  });
});