import { evaluateDataAccessPermission } from '../../src/logic/auth-authorization';
import type { DataAccessEvaluationInput, DataAccessPermissionResult } from '../../src/logic/auth-authorization';

describe('ロールベース権限判定機能', () => {
  // SCEN-2084
  test('ユーザー所属チームIDが空文字列のとき権限判定がエラーになる', () => {
    const invalidInput: DataAccessEvaluationInput = {
      userId: 'user-001',
      userRole: 'engineer',
      userTeamId: '',
      targetDataType: 'report',
      targetTeamId: 'team-001',
      requestedOperation: 'view'
    };

    expect(() => evaluateDataAccessPermission(invalidInput)).toThrow(/チームID/);
  });
});