import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { determineDashboardAccessControl } from '../../src/logic/manager-dashboard';
import type { DashboardAccessControlInput, DashboardAccessControlOutput } from '../../src/logic/manager-dashboard';

describe('課題の優先度を色分けで表示するダッシュボード機能', () => {
  // SCEN-1003: [edge] 職務権限に基づくダッシュボード表示制御 - 同一権限レベルのユーザーが同じ表示対象データセットを取得する
  test('同一職務権限レベルのユーザーは同じアクセス制御ポリシーと表示対象データを取得する', () => {
    // ユーザーA: 部員権限
    const userAInput: DashboardAccessControlInput = {
      userId: 'user-a-001',
      userRole: 'engineer',
      userTeamId: 'team-development-01',
      requestedAccessLevel: 'team_only',
    };

    // ユーザーB: 部員権限（同じ職務権限レベル）
    const userBInput: DashboardAccessControlInput = {
      userId: 'user-b-002',
      userRole: 'engineer',
      userTeamId: 'team-development-01',
      requestedAccessLevel: 'team_only',
    };

    // ユーザーAのアクセス制御結果を取得
    const userAAccessControl: DashboardAccessControlOutput =
      determineDashboardAccessControl(userAInput);

    // ユーザーBのアクセス制御結果を取得
    const userBAccessControl: DashboardAccessControlOutput =
      determineDashboardAccessControl(userBInput);

    // (1) アクセス許可状態が同一であることを検証
    expect(userAAccessControl.isAccessGranted).toBe(true);
    expect(userBAccessControl.isAccessGranted).toBe(true);

    // (2) 付与されたアクセスレベルが同一であることを検証
    expect(userAAccessControl.grantedAccessLevel).toBe('team_only');
    expect(userBAccessControl.grantedAccessLevel).toBe('team_only');

    // (3) 表示可能なデータ範囲（visibleDataScope）が同一であることを検証
    expect(userAAccessControl.visibleDataScope.canViewAllTeams).toBe(false);
    expect(userBAccessControl.visibleDataScope.canViewAllTeams).toBe(false);

    expect(userAAccessControl.visibleDataScope.canViewTeamData).toBe(true);
    expect(userBAccessControl.visibleDataScope.canViewTeamData).toBe(true);

    expect(userAAccessControl.visibleDataScope.canViewSelfDataOnly).toBe(false);
    expect(userBAccessControl.visibleDataScope.canViewSelfDataOnly).toBe(false);

    // 同一チームに属しているため、許可されたチームIDリストが同一であることを検証
    expect(userAAccessControl.visibleDataScope.allowedTeamIds).toEqual(['team-development-01']);
    expect(userBAccessControl.visibleDataScope.allowedTeamIds).toEqual(['team-development-01']);

    // (4) 操作可能な機能が同一であることを検証
    expect(userAAccessControl.editableFeatures.canEditIssuePriority).toBe(false);
    expect(userBAccessControl.editableFeatures.canEditIssuePriority).toBe(false);

    expect(userAAccessControl.editableFeatures.canEditChallengeStatus).toBe(false);
    expect(userBAccessControl.editableFeatures.canEditChallengeStatus).toBe(false);

    expect(userAAccessControl.editableFeatures.canSendReminders).toBe(false);
    expect(userBAccessControl.editableFeatures.canSendReminders).toBe(false);

    expect(userAAccessControl.editableFeatures.canExportReports).toBe(false);
    expect(userBAccessControl.editableFeatures.canExportReports).toBe(false);

    // (5) アクセス拒否理由がないことを検証
    expect(userAAccessControl.denialReason).toBeNull();
    expect(userBAccessControl.denialReason).toBeNull();

    // (6) 両ユーザーの制御ポリシー全体が完全に同一であることを最終検証
    expect(userAAccessControl).toEqual(userBAccessControl);
  });
});