import { determineDashboardAccessControl } from '../../src/logic/manager-dashboard';
import { type DashboardAccessControlInput, type DashboardAccessControlOutput } from '../../src/logic/manager-dashboard';

describe('課題の影響度判定と優先度付け表示機能', () => {
  // SCEN-997
  test('職務権限に基づくダッシュボード表示制御 - 課題優先度編集権限がないメンバーが優先度スコア変更操作を実行不可', () => {
    const userInput: DashboardAccessControlInput = {
      userId: 'user-b-engineer',
      userRole: 'engineer',
      userTeamId: 'team-001',
      requestedAccessLevel: 'self_only',
    };

    const result: DashboardAccessControlOutput = determineDashboardAccessControl(userInput);

    expect(result.isAccessGranted).toBe(true);
    expect(result.grantedAccessLevel).toBe('self_only');
    expect(result.visibleDataScope.canViewAllTeams).toBe(false);
    expect(result.visibleDataScope.canViewTeamData).toBe(false);
    expect(result.visibleDataScope.canViewSelfDataOnly).toBe(true);
    expect(result.visibleDataScope.allowedTeamIds).toEqual(['team-001']);
    expect(result.editableFeatures.canEditIssuePriority).toBe(false);
    expect(result.editableFeatures.canEditChallengeStatus).toBe(false);
    expect(result.editableFeatures.canSendReminders).toBe(false);
    expect(result.editableFeatures.canExportReports).toBe(false);
    expect(result.denialReason).toBeNull();
  });
});