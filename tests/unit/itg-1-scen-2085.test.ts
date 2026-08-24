import { evaluateDataAccessPermission } from '../../src/logic/auth-authorization';

describe('ロールベース権限判定機能', () => {
  // SCEN-2085: [error] ロールベース権限判定機能 - アクセス対象の課題データIDが null のとき権限判定がエラーになる
  test('課題データIDが null の場合、権限判定がエラーになる', () => {
    const input = {
      userId: 'user-001',
      userRole: 'engineer' as const,
      userTeamId: 'team-001',
      targetDataType: 'issue' as const,
      targetTeamId: 'team-001',
      requestedOperation: 'view' as const,
      issueDataId: null,
    };

    expect(() => evaluateDataAccessPermission(input)).toThrow(
      /課題データID|issueDataId/
    );
  });
});