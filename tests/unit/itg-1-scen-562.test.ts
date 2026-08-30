import { judgeAccessPermission } from '../../src/logic/access-control-and-permissions';

describe('朝会報告管理システム - アクセス制御・権限判定', () => {
  // SCEN-562
  test('ユーザーの職務がセキュリティポリシーで定義されていない場合、InvalidRoleErrorをスロー', () => {
    const userId = 'user-unknown';
    const resourceType = 'analysis_report' as const;
    const operation = 'view' as const;
    const targetTeamId = null;
    const confidentialityLevel = 'executive_only' as const;

    const accessRequest = {
      userId,
      resourceType,
      operation,
      targetTeamId,
      confidentialityLevel,
    };

    expect(() => judgeAccessPermission(accessRequest)).toThrow(/職務|役割/);
  });
});