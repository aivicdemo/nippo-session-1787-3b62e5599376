import { determineDashboardAccessControl } from '../../src/logic/manager-dashboard';
import { type DashboardAccessControlInput, type DashboardAccessControlOutput } from '../../src/logic/manager-dashboard';

describe('課題の優先度を色分けで表示するダッシュボード機能', () => {
  // SCEN-1001: [edge] 職務権限に基づくダッシュボード表示制御 - 画面リロード時に権限再判定によって表示対象データが更新される
  test('ダッシュボード画面リロード時に、マネージャー権限から閲覧専用権限へのダウングレードが反映され、表示対象データが制限される', () => {
    // 【前提】マネージャー権限でログイン済み状態を設定
    const user_id_manager = 'user-123';
    const team_id = 'team-001';
    
    // リロード前：マネージャー権限でのアクセス制御を実行
    const input_before_reload: DashboardAccessControlInput = {
      userId: user_id_manager,
      userRole: 'manager',
      userTeamId: team_id,
      requestedAccessLevel: 'full',
    };

    const output_before_reload: DashboardAccessControlOutput = determineDashboardAccessControl(input_before_reload);

    // 【リロード前の検証】マネージャー権限のため、全チームデータ表示が許可される
    expect(output_before_reload.isAccessGranted).toBe(true);
    expect(output_before_reload.grantedAccessLevel).toBe('full');
    expect(output_before_reload.visibleDataScope.canViewAllTeams).toBe(true);
    expect(output_before_reload.visibleDataScope.canViewTeamData).toBe(true);
    expect(output_before_reload.visibleDataScope.canViewSelfDataOnly).toBe(false);
    expect(output_before_reload.visibleDataScope.allowedTeamIds).toContain(team_id);
    expect(output_before_reload.editableFeatures.canEditIssuePriority).toBe(true);
    expect(output_before_reload.editableFeatures.canEditChallengeStatus).toBe(true);
    expect(output_before_reload.editableFeatures.canSendReminders).toBe(true);
    expect(output_before_reload.editableFeatures.canExportReports).toBe(true);
    expect(output_before_reload.denialReason).toBeNull();

    // 【シミュレート】権限ダウングレード：マネージャー → エンジニア（閲覧専用）
    // リロード後：エンジニア権限でのアクセス制御を実行（権限ダウングレードを反映）
    const input_after_reload: DashboardAccessControlInput = {
      userId: user_id_manager,
      userRole: 'engineer',
      userTeamId: team_id,
      requestedAccessLevel: 'self_only',
    };

    const output_after_reload: DashboardAccessControlOutput = determineDashboardAccessControl(input_after_reload);

    // 【リロード後の検証】エンジニア権限のため、自身のデータのみ表示が許可される
    expect(output_after_reload.isAccessGranted).toBe(true);
    expect(output_after_reload.grantedAccessLevel).toBe('self_only');
    expect(output_after_reload.visibleDataScope.canViewAllTeams).toBe(false);
    expect(output_after_reload.visibleDataScope.canViewTeamData).toBe(false);
    expect(output_after_reload.visibleDataScope.canViewSelfDataOnly).toBe(true);
    expect(output_after_reload.visibleDataScope.allowedTeamIds).toEqual([]);
    expect(output_after_reload.editableFeatures.canEditIssuePriority).toBe(false);
    expect(output_after_reload.editableFeatures.canEditChallengeStatus).toBe(false);
    expect(output_after_reload.editableFeatures.canSendReminders).toBe(false);
    expect(output_after_reload.editableFeatures.canExportReports).toBe(false);
    expect(output_after_reload.denialReason).toBeNull();

    // 【権限変更前後の比較】表示対象データが確実に制限される
    expect(output_before_reload.grantedAccessLevel).not.toBe(output_after_reload.grantedAccessLevel);
    expect(output_before_reload.visibleDataScope.canViewAllTeams).toBe(true);
    expect(output_after_reload.visibleDataScope.canViewAllTeams).toBe(false);
    expect(output_before_reload.editableFeatures.canEditIssuePriority).toBe(true);
    expect(output_after_reload.editableFeatures.canEditIssuePriority).toBe(false);
  });
});