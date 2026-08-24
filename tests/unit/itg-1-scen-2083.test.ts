import { evaluateDataAccessPermission } from '../../src/logic/auth-authorization';

describe('朝会報告管理システム - データアクセス権限判定', () => {
  // SCEN-2083: [error] ロールベース権限判定機能 - ユーザー所属チームIDが null のとき権限判定がエラーになる
  test('ユーザー所属チームIDが null の場合、権限判定がエラーをスローする', () => {
    const input_userId = 'user-001';
    const input_userRole = 'engineer' as const;
    const input_userTeamId = null as any;
    const input_targetDataType = 'report' as const;
    const input_targetTeamId = 'team-001';
    const input_requestedOperation = 'view' as const;

    expect(() =>
      evaluateDataAccessPermission({
        userId: input_userId,
        userRole: input_userRole,
        userTeamId: input_userTeamId,
        targetDataType: input_targetDataType,
        targetTeamId: input_targetTeamId,
        requestedOperation: input_requestedOperation,
      })
    ).toThrow(/チームID|所属チーム|null/);
  });
});