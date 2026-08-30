import { judgeAccessPermission } from '../../src/logic/access-control-and-permissions';
import { type AccessPermissionRequest } from '../../src/logic/access-control-and-permissions';

describe('朝会報告管理システム - アクセス制御と権限管理', () => {
  test('SCEN-518: ユーザーIDが空のときユーザー認証失敗エラーをスローする', () => {
    const request: AccessPermissionRequest = {
      userId: '',
      resourceType: 'report',
      operation: 'view',
      targetTeamId: null,
    };

    expect(() => judgeAccessPermission(request)).toThrow(/ユーザー認証/);
  });
});