import { evaluateDataAccessPermission } from '../../src/logic/auth-authorization';
import { type DataAccessEvaluationInput, type DataAccessPermissionResult } from '../../src/logic/auth-authorization';

describe('朝会報告管理システム - ロールベース権限判定機能', () => {
  // SCEN-2094
  test('無効なアクション文字列が与えられたとき権限判定がエラーになる', () => {
    const input: DataAccessEvaluationInput = {
      userId: 'user-001',
      userRole: 'engineer',
      userTeamId: 'team-a',
      targetDataType: 'report',
      targetTeamId: 'team-a',
      requestedOperation: 'INVALID_ACTION_XYZ' as any,
    };

    expect(() => evaluateDataAccessPermission(input)).toThrow(/アクション/);
  });
});