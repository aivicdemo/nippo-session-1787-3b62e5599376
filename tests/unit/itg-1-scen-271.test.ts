import { judgeAccessPermission } from '../../src/logic/access-control-and-permissions';

describe('朝会報告管理システム - アクセス制御と権限管理', () => {
  // SCEN-271: ユーザーの役割がデータベースに登録されていないときのエラーハンドリング
  test('ユーザーの役割がデータベースに登録されていない場合、InvalidRoleErrorをスローすること', () => {
    const userId = 'user-999';
    const resourceType = 'report' as const;
    const operation = 'view' as const;
    const targetTeamId = null;
    const confidentialityLevel = 'internal' as const;

    const request = {
      userId,
      resourceType,
      operation,
      targetTeamId,
      confidentialityLevel,
    };

    expect(() => judgeAccessPermission(request)).toThrow(/役割/);
  });
});