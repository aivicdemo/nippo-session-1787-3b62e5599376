import { evaluateDataAccessPermission, type DataAccessEvaluationInput, type DataAccessPermissionResult } from '../../src/logic/auth-authorization';

describe('ロールベース権限判定機能', () => {
  // SCEN-2096
  test('ユーザーが削除済み状態のとき権限判定がエラーになる', () => {
    const deletedUserInput: DataAccessEvaluationInput = {
      userId: 'user-deleted-001',
      userRole: 'engineer',
      userTeamId: 'team-001',
      targetDataType: 'report',
      targetTeamId: 'team-001',
      requestedOperation: 'view',
    };

    expect(() => {
      evaluateDataAccessPermission(deletedUserInput);
    }).toThrow(/USER_DELETED/);
  });
});