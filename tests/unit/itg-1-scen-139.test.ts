import { evaluateDataAccessPermission } from '../../src/logic/auth-authorization';
import type { DataAccessEvaluationInput, DataAccessPermissionResult } from '../../src/logic/auth-authorization';

describe('優先度の高い課題を部長向けダッシュボードで強調表示', () => {
  // SCEN-139
  test('部長役割ユーザーがダッシュボードにアクセスしたとき、全チーム課題の優先度スコアと報告提出状況が表示される', () => {
    const managerUserId = 'manager_001';
    const managerRole = 'manager' as const;
    const managerTeamId = 'team_shared_001';

    const targetDataType = 'dashboard' as const;
    const requestedOperation = 'view' as const;

    const input: DataAccessEvaluationInput = {
      userId: managerUserId,
      userRole: managerRole,
      userTeamId: managerTeamId,
      targetDataType: targetDataType,
      targetTeamId: 'team_shared_001',
      requestedOperation: requestedOperation,
    };

    const result: DataAccessPermissionResult = evaluateDataAccessPermission(input);

    expect(result.isPermitted).toBe(true);
    expect(result.permittedOperations).toContain('view');
    expect(result.dataScope).toBe('all_teams');
    expect(result.decryptionKey).not.toBeNull();
    expect(typeof result.decryptionKey).toBe('string');
    expect(result.decryptionKey?.length).toBeGreaterThan(0);
  });
});