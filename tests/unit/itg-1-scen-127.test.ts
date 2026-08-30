import { judgeAccessPermission, type AccessPermissionResult } from '../../src/logic/access-control-and-permissions';

describe('朝会報告管理システム - アクセス権限判定', () => {
  // SCEN-127: [normal] ユーザーの役割と要求されたリソース・操作に基づいて、アクセス可否を判定し、許可/拒否の結果を返す。
  test('SCEN-127: judgeAccessPermissionが代表的な正常入力を設計どおり処理する', () => {
    const userId = 'user-001';
    const resourceType = 'report' as const;
    const operation = 'view' as const;
    const targetTeamId = null;
    const confidentialityLevel = 'internal' as const;

    const result: AccessPermissionResult = judgeAccessPermission({
      userId,
      resourceType,
      operation,
      targetTeamId,
      confidentialityLevel,
    });

    expect(result.isPermitted).toBe(true);
    expect(result.userRole).toBe('engineer');
    expect(result.denialReason).toBeNull();
    expect(result.applicableDataFilters).toBeDefined();
    expect(result.applicableDataFilters?.visibleTeamIds).toBeDefined();
    expect(Array.isArray(result.applicableDataFilters?.visibleTeamIds)).toBe(true);
    expect(result.applicableDataFilters?.viewOnlyMode).toBe(true);
  });
});