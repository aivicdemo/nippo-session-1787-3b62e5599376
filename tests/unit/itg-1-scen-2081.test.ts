import { evaluateDataAccessPermission } from '../../src/logic/auth-authorization';

describe('ロールベース権限判定機能', () => {
  test('SCEN-2081: ユーザーロールが null のとき権限判定がエラーになる', () => {
    const invalidUserContext = {
      userId: 'user-001',
      userRole: null as any,
      userTeamId: 'team-001',
      targetDataType: 'report' as const,
      targetTeamId: 'team-001',
      requestedOperation: 'view' as const,
    };

    expect(() => {
      evaluateDataAccessPermission(invalidUserContext);
    }).toThrow(/ロール/);
  });
});