import { judgeAccessPermission, type AccessPermissionRequest } from '../../src/logic/access-control-and-permissions';

describe('朝会報告管理システム - アクセス制御と権限管理', () => {
  // SCEN-270
  test('ユーザーIDが空文字列の場合、ユーザー認証失敗の例外をスロー', () => {
    const request: AccessPermissionRequest = {
      userId: '',
      resourceType: 'report',
      operation: 'view',
      targetTeamId: null,
      confidentialityLevel: 'internal',
    };

    expect(() => judgeAccessPermission(request)).toThrow(/ユーザー認証/);
  });
});