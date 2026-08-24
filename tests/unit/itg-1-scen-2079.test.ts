import { evaluateDataAccessPermission } from '../../src/logic/auth-authorization';

describe('ロールベース権限判定機能', () => {
  test('SCEN-2079: ユーザーIDがnullのとき権限判定がエラーになる', () => {
    const input = {
      userId: null as any,
      userRole: 'engineer' as const,
      userTeamId: 'team-001',
      targetDataType: 'report' as const,
      targetTeamId: 'team-001',
      requestedOperation: 'view' as const,
    };

    expect(() => evaluateDataAccessPermission(input)).toThrow(/ユーザーID/);
  });
});