import { evaluateDataAccessPermission } from '../../src/logic/auth-authorization';

describe('朝会報告管理システム - ロールベース権限判定機能', () => {
  // SCEN-2088
  test('要求アクションが空文字列のとき権限判定がエラーになる', () => {
    const input = {
      userId: 'user-001',
      userRole: 'engineer' as const,
      userTeamId: 'team-A',
      targetDataType: 'report' as const,
      targetTeamId: 'team-A',
      requestedOperation: '' as any,
    };

    expect(() => evaluateDataAccessPermission(input)).toThrow(/要求アクション/);
  });
});