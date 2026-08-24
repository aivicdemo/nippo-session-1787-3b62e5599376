import { describe, test, expect, beforeEach } from '@jest/globals';
import { determineDashboardAccessControl } from '../../src/logic/manager-dashboard';
import { type DashboardAccessControlInput, type DashboardAccessControlOutput } from '../../src/logic/manager-dashboard';

describe('determineDashboardAccessControl', () => {
  // SCEN-996: [edge] 職務権限に基づくダッシュボード表示制御 - 課題優先度編集権限がある部長が優先度スコア変更操作を実行可能
  test('should grant full access with issue priority edit capability to manager with appropriate permissions', () => {
    // Precondition: 部長ユーザー（職務権限: 課題優先度編集権限あり）でシステムにログイン
    const input: DashboardAccessControlInput = {
      userId: 'user-001',
      userRole: 'manager',
      userTeamId: 'team-dev-001',
      requestedAccessLevel: 'full',
    };

    // Action: determineDashboardAccessControl を呼び出して権限判定を実行
    const result: DashboardAccessControlOutput = determineDashboardAccessControl(input);

    // Outcome: 部長ユーザーが課題の優先度スコアを編集可能であることを確認
    // - アクセスが許可されている
    expect(result.isAccessGranted).toBe(true);

    // - 付与されたアクセスレベルが 'full' である
    expect(result.grantedAccessLevel).toBe('full');

    // - 表示可能なデータスコープ: 全チーム表示可能
    expect(result.visibleDataScope.canViewAllTeams).toBe(true);
    expect(result.visibleDataScope.canViewTeamData).toBe(true);
    expect(result.visibleDataScope.canViewSelfDataOnly).toBe(false);
    expect(Array.isArray(result.visibleDataScope.allowedTeamIds)).toBe(true);
    expect(result.visibleDataScope.allowedTeamIds.length).toBeGreaterThan(0);

    // - 編集可能な機能: 課題優先度編集が可能
    expect(result.editableFeatures.canEditIssuePriority).toBe(true);
    expect(result.editableFeatures.canEditChallengeStatus).toBe(true);
    expect(result.editableFeatures.canSendReminders).toBe(true);
    expect(result.editableFeatures.canExportReports).toBe(true);

    // - 拒否理由が null である（アクセス許可のため）
    expect(result.denialReason).toBeNull();
  });
});