import { evaluateDataAccessPermission } from '../../src/logic/auth-authorization';
import type {
  DataAccessEvaluationInput,
  DataAccessPermissionResult,
} from '../../src/logic/auth-authorization';

describe('ロールベース権限判定機能 - データアクセス権限評価', () => {
  // SCEN-2102
  test('同一ロール重複登録時に権限判定が重複適用されずキャッシュが単一エントリのみ保持される', () => {
    const userId = 'user123';
    const userRole = 'manager';
    const userTeamId = 'team-dev-001';
    const targetDataType = 'report';
    const targetTeamId = 'team-dev-001';
    const requestedOperation = 'view';

    const input: DataAccessEvaluationInput = {
      userId,
      userRole,
      userTeamId,
      targetDataType,
      targetTeamId,
      requestedOperation,
    };

    const result: DataAccessPermissionResult =
      evaluateDataAccessPermission(input);

    expect(result.isPermitted).toBe(true);
    expect(result.permittedOperations).toContain('view');
    expect(result.dataScope).toBe('own_team');
    expect(result.decryptionKey).not.toBeNull();
    expect(typeof result.decryptionKey).toBe('string');
    expect(result.decryptionKey).toMatch(/.+/);
  });
});