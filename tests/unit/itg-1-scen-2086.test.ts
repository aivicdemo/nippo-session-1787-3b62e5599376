import { describe, test, expect } from '@jest/globals';
import { evaluateDataAccessPermission } from '../../src/logic/auth-authorization';

describe('ロールベース権限判定機能 - アクセス対象の課題データIDが空文字列のときエラー', () => {
  // SCEN-2086
  test('課題データIDが空文字列のとき権限判定がエラーになる', () => {
    const input = {
      userId: 'user-123',
      userRole: 'engineer' as const,
      userTeamId: 'team-001',
      targetDataType: 'issue' as const,
      targetTeamId: 'team-001',
      requestedOperation: 'view' as const,
      issueDataId: '',
    };

    expect(() => evaluateDataAccessPermission(input)).toThrow(/課題データID/);
  });
});