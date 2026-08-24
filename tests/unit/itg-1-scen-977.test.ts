import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { determineDashboardAccessControl } from '../../src/logic/manager-dashboard';
import type { DashboardAccessControlInput, DashboardAccessControlOutput } from '../../src/logic/manager-dashboard';

describe('ダッシュボード権限判定機能', () => {
  // SCEN-977
  it('[normal] ダッシュボード画面をリロードした場合も権限判定が正しく実行される', () => {
    // === Setup: ユーザーAのコンテキスト（一般ユーザー権限）===
    const userContextA: DashboardAccessControlInput = {
      userId: 'user-001',
      userRole: 'engineer',
      userTeamId: 'team-alpha',
      requestedAccessLevel: 'self_only',
    };

    // === Action 1: 初回ダッシュボード画面表示時の権限判定 ===
    const initialAccessResult: DashboardAccessControlOutput =
      determineDashboardAccessControl(userContextA);

    // === Assertion 1: 初回の権限判定結果を検証 ===
    expect(initialAccessResult.isAccessGranted).toBe(true);
    expect(initialAccessResult.grantedAccessLevel).toBe('self_only');
    expect(initialAccessResult.visibleDataScope.canViewAllTeams).toBe(false);
    expect(initialAccessResult.visibleDataScope.canViewTeamData).toBe(false);
    expect(initialAccessResult.visibleDataScope.canViewSelfDataOnly).toBe(true);
    expect(initialAccessResult.visibleDataScope.allowedTeamIds).toEqual(['team-alpha']);
    expect(initialAccessResult.editableFeatures.canEditIssuePriority).toBe(false);
    expect(initialAccessResult.editableFeatures.canEditChallengeStatus).toBe(false);
    expect(initialAccessResult.editableFeatures.canSendReminders).toBe(false);
    expect(initialAccessResult.editableFeatures.canExportReports).toBe(false);
    expect(initialAccessResult.denialReason).toBeNull();

    // === Action 2: ブラウザリロード後の権限判定（同じコンテキストで再実行） ===
    const reloadedAccessResult: DashboardAccessControlOutput =
      determineDashboardAccessControl(userContextA);

    // === Assertion 2: リロード後も同じ権限判定結果が返される ===
    expect(reloadedAccessResult.isAccessGranted).toBe(true);
    expect(reloadedAccessResult.grantedAccessLevel).toBe('self_only');
    expect(reloadedAccessResult.visibleDataScope.canViewAllTeams).toBe(false);
    expect(reloadedAccessResult.visibleDataScope.canViewTeamData).toBe(false);
    expect(reloadedAccessResult.visibleDataScope.canViewSelfDataOnly).toBe(true);
    expect(reloadedAccessResult.visibleDataScope.allowedTeamIds).toEqual(['team-alpha']);
    expect(reloadedAccessResult.editableFeatures.canEditIssuePriority).toBe(false);
    expect(reloadedAccessResult.editableFeatures.canEditChallengeStatus).toBe(false);
    expect(reloadedAccessResult.editableFeatures.canSendReminders).toBe(false);
    expect(reloadedAccessResult.editableFeatures.canExportReports).toBe(false);
    expect(reloadedAccessResult.denialReason).toBeNull();

    // === Assertion 3: リロード前後で表示内容（権限判定結果）が同一であることを検証 ===
    expect(initialAccessResult).toEqual(reloadedAccessResult);
  });
});