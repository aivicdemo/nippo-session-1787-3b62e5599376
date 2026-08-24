import { evaluateDataAccessPermission } from '../../src/logic/auth-authorization';

describe('朝会報告管理システム - ロールベース権限判定機能', () => {
  // SCEN-2087
  test('要求アクション（閲覧・編集・削除）が null のとき権限判定がエラーになる', () => {
    const input: any = {
      userId: 'user123',
      userRole: 'engineer' as const,
      userTeamId: 'team001',
      targetDataType: 'report' as const,
      targetTeamId: 'team001',
      requestedOperation: null,
    };

    expect(() => {
      evaluateDataAccessPermission(input);
    }).toThrow(/requiredAction|action/i);
  });
});