import { evaluateDataAccessPermission } from '../../src/logic/auth-authorization';

describe('ロールベース権限判定機能', () => {
  // SCEN-2093
  test('ユーザーチーム関連テーブルに該当レコードが存在しないときエラーになる', () => {
    const input = {
      userId: 'U001',
      userRole: 'engineer' as const,
      userTeamId: 'T001',
      targetDataType: 'report' as const,
      targetTeamId: 'T001',
      requestedOperation: 'view' as const,
    };

    expect(() => evaluateDataAccessPermission(input)).toThrow(/ユーザーチーム関連/);
  });
});