import { evaluateDataAccessPermission } from '../../src/logic/auth-authorization';

describe('朝会報告管理システム - ロールベース権限判定機能', () => {
  // SCEN-2092
  test('無効なロール文字列が与えられたとき権限判定がエラーになる', () => {
    const invalidRole = 'undefined_role';
    const userId = 'user-001';
    const userTeamId = 'team-001';
    const targetTeamId = 'team-001';
    const targetDataType = 'report';
    const requestedOperation = 'view';

    expect(() =>
      evaluateDataAccessPermission({
        userId,
        userRole: invalidRole as 'engineer' | 'manager' | 'admin',
        userTeamId,
        targetDataType,
        targetTeamId,
        requestedOperation,
      })
    ).toThrow(/無効なロール|ロール|Unknown role|定義されていません/i);
  });
});