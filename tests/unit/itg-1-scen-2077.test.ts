import { evaluateDataAccessPermission } from '../../src/logic/auth-authorization';
import type { DataAccessEvaluationInput, DataAccessPermissionResult } from '../../src/logic/auth-authorization';

describe('ロールベース権限判定機能 - 複数件課題データの表示制御', () => {
  // SCEN-2077
  test('管理者ロールで複数課題すべてが表示される', () => {
    // 管理者ロールでのアクセス評価入力
    const adminEvaluationInput: DataAccessEvaluationInput = {
      userId: 'admin-user-001',
      userRole: 'admin',
      userTeamId: 'team-001',
      targetDataType: 'issue',
      targetTeamId: 'team-001',
      requestedOperation: 'view',
    };

    // 管理者権限での評価実行
    const adminResult: DataAccessPermissionResult = evaluateDataAccessPermission(adminEvaluationInput);

    // 管理者は全課題表示権限を持つ
    expect(adminResult.isPermitted).toBe(true);
    expect(adminResult.permittedOperations).toContain('view');
    expect(adminResult.dataScope).toBe('all_teams');
    expect(adminResult.decryptionKey).not.toBeNull();

    // エンジニアロールでのアクセス評価入力（自チーム課題のみ表示可能）
    const engineerEvaluationInput: DataAccessEvaluationInput = {
      userId: 'engineer-user-001',
      userRole: 'engineer',
      userTeamId: 'team-001',
      targetDataType: 'issue',
      targetTeamId: 'team-001',
      requestedOperation: 'view',
    };

    const engineerResult: DataAccessPermissionResult = evaluateDataAccessPermission(engineerEvaluationInput);

    // エンジニアは自チームの課題のみ表示可能
    expect(engineerResult.isPermitted).toBe(true);
    expect(engineerResult.permittedOperations).toContain('view');
    expect(engineerResult.dataScope).toBe('own_team');
    expect(engineerResult.decryptionKey).not.toBeNull();

    // マネージャーロールでのアクセス評価入力（所属チーム課題の表示・編集可能）
    const managerEvaluationInput: DataAccessEvaluationInput = {
      userId: 'manager-user-001',
      userRole: 'manager',
      userTeamId: 'team-001',
      targetDataType: 'issue',
      targetTeamId: 'team-001',
      requestedOperation: 'view',
    };

    const managerResult: DataAccessPermissionResult = evaluateDataAccessPermission(managerEvaluationInput);

    // マネージャーは所属チームの課題を表示・編集可能
    expect(managerResult.isPermitted).toBe(true);
    expect(managerResult.permittedOperations).toContain('view');
    expect(managerResult.permittedOperations).toContain('edit');
    expect(managerResult.dataScope).toBe('own_team');
    expect(managerResult.decryptionKey).not.toBeNull();

    // 他チームへのアクセス拒否確認
    const unauthorizedAccessInput: DataAccessEvaluationInput = {
      userId: 'engineer-user-001',
      userRole: 'engineer',
      userTeamId: 'team-001',
      targetDataType: 'issue',
      targetTeamId: 'team-002',
      requestedOperation: 'view',
    };

    const unauthorizedResult: DataAccessPermissionResult = evaluateDataAccessPermission(unauthorizedAccessInput);

    // エンジニアは他チームの課題にアクセスできない
    expect(unauthorizedResult.isPermitted).toBe(false);
    expect(unauthorizedResult.dataScope).toBe('none');
    expect(unauthorizedResult.decryptionKey).toBeNull();
  });
});