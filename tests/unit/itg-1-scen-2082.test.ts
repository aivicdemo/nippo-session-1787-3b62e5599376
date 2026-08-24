import { evaluateDataAccessPermission } from '../../src/logic/auth-authorization';

describe('朝会報告管理システム - ロールベース権限判定', () => {
  // SCEN-2082: [error] ロールベース権限判定機能 - ユーザーロールが空文字列のとき権限判定がエラーになる
  test('should throw error when userRole is empty string', () => {
    const input = {
      userId: 'user-001',
      userRole: '',
      userTeamId: 'team-001',
      targetDataType: 'report' as const,
      targetTeamId: 'team-001',
      requestedOperation: 'view' as const,
    };

    expect(() => evaluateDataAccessPermission(input)).toThrow(/ユーザーロール/);
  });
});