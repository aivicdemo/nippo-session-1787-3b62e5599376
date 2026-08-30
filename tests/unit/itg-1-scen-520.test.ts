import { judgeAccessPermission } from '../../src/logic/access-control-and-permissions';

describe('朝会報告管理システム - アクセス制御と権限管理', () => {
  test('SCEN-520: 課題データの機密性レベルが不正な値のとき、警告ログを出力してデフォルトレベルで処理を続行', () => {
    // テストユーザーのセットアップ
    const userId = 'user-001';
    const userRole = 'engineer';
    const teamId = 'team-A';

    // 不正な機密性レベルを含むAccessPermissionRequestを構築
    const request = {
      userId: userId,
      resourceType: 'issue_data' as const,
      operation: 'view' as const,
      targetTeamId: teamId,
      confidentialityLevel: 'invalid_level' as any, // 不正な値
    };

    // judgeAccessPermission関数を呼び出す
    const result = judgeAccessPermission(request);

    // isPermittedフィールドの確認: engineer が issue_data を view できるため true
    expect(result.isPermitted).toBe(true);

    // userRoleフィールドの確認: 'engineer' が返される
    expect(result.userRole).toBe('engineer');

    // denialReasonフィールドの確認: 許可されているため null
    expect(result.denialReason).toBeNull();

    // applicableDataFiltersフィールドの確認: null でないことと team-A に限定されていることを確認
    expect(result.applicableDataFilters).not.toBeNull();
    if (result.applicableDataFilters) {
      expect(result.applicableDataFilters.visibleTeamIds).toContain(teamId);
      expect(result.applicableDataFilters.viewOnlyMode).toBe(true);
    }
  });
});