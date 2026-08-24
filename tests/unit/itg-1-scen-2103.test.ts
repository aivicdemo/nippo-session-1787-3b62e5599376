import { evaluateDataAccessPermission, type DataAccessEvaluationInput, type DataAccessPermissionResult } from '../../src/logic/auth-authorization';

describe('ロールベース権限判定機能 - ロール昇格・降格後の権限判定', () => {
  test('SCEN-2103: ユーザーのロール権限が昇格・降格した直後に新しい権限が正確に適用される', () => {
    // ステップ1-4: 初期状態 - ユーザーA（部員ロール）が日報を作成・表示可能
    const userA_initial_engineer_view_own_report: DataAccessEvaluationInput = {
      userId: 'user-A-001',
      userRole: 'engineer',
      userTeamId: 'team-01',
      targetDataType: 'report',
      targetTeamId: 'team-01',
      requestedOperation: 'view',
    };

    const result_engineer_view_own_report: DataAccessPermissionResult = evaluateDataAccessPermission(userA_initial_engineer_view_own_report);

    expect(result_engineer_view_own_report.isPermitted).toBe(true);
    expect(result_engineer_view_own_report.permittedOperations).toContain('view');
    expect(result_engineer_view_own_report.permittedOperations).toContain('edit');
    expect(result_engineer_view_own_report.dataScope).toBe('own_team');
    expect(result_engineer_view_own_report.decryptionKey).toBeNull();

    // ステップ5-7: ロール昇格後 - ユーザーAが『チームリーダー』に昇格
    // ステップ8: チームリーダーは他メンバーの日報一覧を閲覧可能
    const userA_promoted_manager_view_team_reports: DataAccessEvaluationInput = {
      userId: 'user-A-001',
      userRole: 'manager',
      userTeamId: 'team-01',
      targetDataType: 'report',
      targetTeamId: 'team-01',
      requestedOperation: 'view',
    };

    const result_manager_view_team_reports: DataAccessPermissionResult = evaluateDataAccessPermission(userA_promoted_manager_view_team_reports);

    expect(result_manager_view_team_reports.isPermitted).toBe(true);
    expect(result_manager_view_team_reports.permittedOperations).toContain('view');
    expect(result_manager_view_team_reports.permittedOperations).toContain('edit');
    expect(result_manager_view_team_reports.dataScope).toBe('all_teams');
    expect(result_manager_view_team_reports.decryptionKey).not.toBeNull();

    // ステップ9-11: ロール降格後 - ユーザーAが『部員』に降格
    // ステップ12: 部員は他メンバーの日報一覧へのアクセスが拒否される
    const userA_demoted_engineer_view_team_reports: DataAccessEvaluationInput = {
      userId: 'user-A-001',
      userRole: 'engineer',
      userTeamId: 'team-01',
      targetDataType: 'report',
      targetTeamId: 'team-01',
      requestedOperation: 'view',
    };

    const result_engineer_view_team_reports: DataAccessPermissionResult = evaluateDataAccessPermission(userA_demoted_engineer_view_team_reports);

    // 降格後、エンジニアは他チームのデータにアクセス不可
    expect(result_engineer_view_team_reports.isPermitted).toBe(true);
    expect(result_engineer_view_team_reports.dataScope).toBe('own_team');
    expect(result_engineer_view_team_reports.permittedOperations).toEqual(expect.arrayContaining(['view']));
    expect(result_engineer_view_team_reports.decryptionKey).toBeNull();

    // 追加検証: エンジニアが他チームのデータにアクセスしようとした場合
    const userA_demoted_engineer_view_other_team_reports: DataAccessEvaluationInput = {
      userId: 'user-A-001',
      userRole: 'engineer',
      userTeamId: 'team-01',
      targetDataType: 'report',
      targetTeamId: 'team-02',
      requestedOperation: 'view',
    };

    const result_engineer_view_other_team_reports: DataAccessPermissionResult = evaluateDataAccessPermission(userA_demoted_engineer_view_other_team_reports);

    // エンジニアは別チームのデータにアクセス不可
    expect(result_engineer_view_other_team_reports.isPermitted).toBe(false);
    expect(result_engineer_view_other_team_reports.dataScope).toBe('none');
    expect(result_engineer_view_other_team_reports.permittedOperations).toEqual([]);
    expect(result_engineer_view_other_team_reports.decryptionKey).toBeNull();

    // 昇格時の管理者権限検証: マネージャーは全チームデータにアクセス可能
    const userA_promoted_manager_view_other_team_reports: DataAccessEvaluationInput = {
      userId: 'user-A-001',
      userRole: 'manager',
      userTeamId: 'team-01',
      targetDataType: 'report',
      targetTeamId: 'team-02',
      requestedOperation: 'view',
    };

    const result_manager_view_other_team_reports: DataAccessPermissionResult = evaluateDataAccessPermission(userA_promoted_manager_view_other_team_reports);

    expect(result_manager_view_other_team_reports.isPermitted).toBe(true);
    expect(result_manager_view_other_team_reports.dataScope).toBe('all_teams');
    expect(result_manager_view_other_team_reports.permittedOperations).toContain('view');
    expect(result_manager_view_other_team_reports.decryptionKey).not.toBeNull();

    // 昇格・降格後のロール権限が新しい権限に正確に適用されたことを確認
    expect(result_manager_view_team_reports.dataScope).not.toBe(result_engineer_view_team_reports.dataScope);
    expect(result_manager_view_other_team_reports.isPermitted).not.toBe(result_engineer_view_other_team_reports.isPermitted);
  });
});