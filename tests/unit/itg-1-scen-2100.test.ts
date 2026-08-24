import { evaluateDataAccessPermission } from '../../src/logic/auth-authorization';

describe('ロールベース権限判定機能 - データアクセス権限の判定', () => {
  // SCEN-2100
  test('エンジニアが属さないチームの課題データへのアクセスを要求した場合、アクセス権限なしで拒否される', () => {
    const input = {
      userId: 'engineer-a-001',
      userRole: 'engineer' as const,
      userTeamId: 'team-x-001',
      targetDataType: 'issue' as const,
      targetTeamId: 'team-y-001',
      requestedOperation: 'view' as const,
    };

    const result = evaluateDataAccessPermission(input);

    expect(result.isPermitted).toBe(false);
    expect(result.permittedOperations).toEqual([]);
    expect(result.dataScope).toBe('none');
    expect(result.decryptionKey).toBeNull();
  });
});