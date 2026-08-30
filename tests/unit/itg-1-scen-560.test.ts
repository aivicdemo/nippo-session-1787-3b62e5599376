import { judgeAccessPermission } from '../../src/logic/access-control-and-permissions';

describe('Access Control and Permissions', () => {
  test('SCEN-560: [normal] ユーザーの役割と要求されたリソース・操作に基づいて、アクセス可否を判定し、許可/拒否の結果を返す', () => {
    const userId = 'user-dev-manager-001';
    const resourceType = 'analysis_report';
    const operation = 'view';
    const targetTeamId = 'team-dev';
    const confidentialityLevel = 'executive_only';

    const result = judgeAccessPermission({
      userId,
      resourceType,
      operation,
      targetTeamId,
      confidentialityLevel,
    });

    expect(result.isPermitted).toBe(false);
    expect(result.userRole).toBe('manager');
    expect(result.denialReason).toBe('この資料の機密レベルが高く、閲覧権限がありません。');
    expect(result.applicableDataFilters).toBe(null);
  });
});