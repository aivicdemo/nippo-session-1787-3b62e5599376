import { describe, test, expect } from '@jest/globals';
import { evaluateDataAccessPermission } from '../../src/logic/auth-authorization';

describe('ロールベース権限判定機能', () => {
  // SCEN-2080
  test('ユーザーIDが空文字列のとき権限判定がエラーになる', () => {
    const input = {
      userId: '',
      userRole: 'engineer' as const,
      userTeamId: 'team-001',
      targetDataType: 'report' as const,
      targetTeamId: 'team-001',
      requestedOperation: 'view' as const,
    };

    expect(() => evaluateDataAccessPermission(input)).toThrow(/ユーザーID/);
  });
});