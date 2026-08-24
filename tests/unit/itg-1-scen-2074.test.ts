import { evaluateDataAccessPermission, type DataAccessEvaluationInput, type DataAccessPermissionResult } from '../../src/logic/auth-authorization';

describe('ロールベース権限判定機能 - 複数チーム所属ユーザーの課題データ閲覧', () => {
  // SCEN-2074
  test('複数チームに属するユーザーが全所属チームの課題データを閲覧でき、所属外チームへのアクセスは拒否される', () => {
    // ユーザーAが『営業チーム』『企画チーム』の2つのチームに属する状態を初期化
    const userId = 'user-A-001';
    const userRole = 'engineer';
    const userTeamId = 'team-sales-001'; // ユーザーの所属チーム（複数所属の場合は評価チーム）
    
    // Case 1: ユーザーAが『営業チーム』の課題データ（view操作）をアクセス試行
    const evaluationInput1: DataAccessEvaluationInput = {
      userId: userId,
      userRole: userRole,
      userTeamId: userTeamId,
      targetDataType: 'issue',
      targetTeamId: 'team-sales-001', // 営業チーム（ユーザーの所属チーム）
      requestedOperation: 'view'
    };

    const result1: DataAccessPermissionResult = evaluateDataAccessPermission(evaluationInput1);

    // 期待結果: ユーザーAは営業チームに所属しているため課題データの閲覧が許可される
    expect(result1.isPermitted).toBe(true);
    expect(result1.permittedOperations).toContain('view');
    expect(result1.dataScope).toBe('own_team');
    expect(result1.decryptionKey).not.toBeNull();

    // Case 2: ユーザーAが『企画チーム』の課題データ（view操作）をアクセス試行
    // 注記: 複数チーム所属の場合、別チーム切り替え時の権限評価
    const evaluationInput2: DataAccessEvaluationInput = {
      userId: userId,
      userRole: userRole,
      userTeamId: 'team-planning-001', // 企画チームへの所属を示す
      targetDataType: 'issue',
      targetTeamId: 'team-planning-001', // 企画チーム
      requestedOperation: 'view'
    };

    const result2: DataAccessPermissionResult = evaluateDataAccessPermission(evaluationInput2);

    // 期待結果: ユーザーAは企画チームにも所属しているため課題データの閲覧が許可される
    expect(result2.isPermitted).toBe(true);
    expect(result2.permittedOperations).toContain('view');
    expect(result2.dataScope).toBe('own_team');
    expect(result2.decryptionKey).not.toBeNull();

    // Case 3: ユーザーAが所属していない『人事チーム』の課題データ（view操作）をアクセス試行
    const evaluationInput3: DataAccessEvaluationInput = {
      userId: userId,
      userRole: userRole,
      userTeamId: 'team-sales-001', // ユーザーの実際の所属チーム
      targetDataType: 'issue',
      targetTeamId: 'team-hr-001', // 人事チーム（ユーザーが所属していない）
      requestedOperation: 'view'
    };

    const result3: DataAccessPermissionResult = evaluateDataAccessPermission(evaluationInput3);

    // 期待結果: ユーザーAは人事チームに所属していないため課題データの閲覧が拒否される
    expect(result3.isPermitted).toBe(false);
    expect(result3.permittedOperations).toHaveLength(0);
    expect(result3.dataScope).toBe('none');
    expect(result3.decryptionKey).toBeNull();
  });
});