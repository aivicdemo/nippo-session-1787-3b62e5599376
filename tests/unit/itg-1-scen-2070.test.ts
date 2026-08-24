import { evaluateDataAccessPermission } from '../../src/logic/auth-authorization';
import { type DataAccessEvaluationInput, type DataAccessPermissionResult } from '../../src/logic/auth-authorization';

describe('ロールベース権限判定機能 - PMが自チーム内の全課題データを閲覧・編集できる', () => {
  test('SCEN-2070: PM ロール（PM001）が自チーム（TEAM_A）内の全課題データを閲覧・編集でき、他チーム（TEAM_B）の課題アクセスが拒否される', () => {
    // テストデータ: PM001 が TEAM_A に属し、管理者ロール
    const pmUserEvalInput: DataAccessEvaluationInput = {
      userId: 'PM001',
      userRole: 'manager',
      userTeamId: 'TEAM_A',
      targetDataType: 'issue',
      targetTeamId: 'TEAM_A',
      requestedOperation: 'view',
    };

    // ステップ 4-6: PM001 が TEAM_A の課題一覧を閲覧するケース
    const viewResultTeamA: DataAccessPermissionResult = evaluateDataAccessPermission(pmUserEvalInput);

    // TEAM_A の課題閲覧権限を確認
    expect(viewResultTeamA.isPermitted).toBe(true);
    expect(viewResultTeamA.permittedOperations).toContain('view');
    expect(viewResultTeamA.permittedOperations).toContain('edit');
    expect(viewResultTeamA.permittedOperations).toContain('delete');
    expect(viewResultTeamA.dataScope).toBe('own_team');
    expect(viewResultTeamA.decryptionKey).not.toBeNull();

    // ステップ 5: PM001 が TEAM_A の課題 ISSUE001 を編集するケース
    const editIssue001Input: DataAccessEvaluationInput = {
      userId: 'PM001',
      userRole: 'manager',
      userTeamId: 'TEAM_A',
      targetDataType: 'issue',
      targetTeamId: 'TEAM_A',
      requestedOperation: 'edit',
    };

    const editResultIssue001: DataAccessPermissionResult = evaluateDataAccessPermission(editIssue001Input);

    expect(editResultIssue001.isPermitted).toBe(true);
    expect(editResultIssue001.permittedOperations).toContain('edit');
    expect(editResultIssue001.dataScope).toBe('own_team');

    // TEAM_A の課題 ISSUE002 を閲覧・編集するケース
    const editIssue002Input: DataAccessEvaluationInput = {
      userId: 'PM001',
      userRole: 'manager',
      userTeamId: 'TEAM_A',
      targetDataType: 'issue',
      targetTeamId: 'TEAM_A',
      requestedOperation: 'edit',
    };

    const editResultIssue002: DataAccessPermissionResult = evaluateDataAccessPermission(editIssue002Input);

    expect(editResultIssue002.isPermitted).toBe(true);
    expect(editResultIssue002.permittedOperations).toContain('edit');

    // TEAM_A の課題 ISSUE003 を閲覧・編集するケース
    const editIssue003Input: DataAccessEvaluationInput = {
      userId: 'PM001',
      userRole: 'manager',
      userTeamId: 'TEAM_A',
      targetDataType: 'issue',
      targetTeamId: 'TEAM_A',
      requestedOperation: 'edit',
    };

    const editResultIssue003: DataAccessPermissionResult = evaluateDataAccessPermission(editIssue003Input);

    expect(editResultIssue003.isPermitted).toBe(true);
    expect(editResultIssue003.permittedOperations).toContain('edit');

    // ステップ 7: PM001 が TEAM_B の課題 ISSUE999 にアクセスを試みるケース
    const accessTeamBInput: DataAccessEvaluationInput = {
      userId: 'PM001',
      userRole: 'manager',
      userTeamId: 'TEAM_A',
      targetDataType: 'issue',
      targetTeamId: 'TEAM_B',
      requestedOperation: 'view',
    };

    const accessTeamBResult: DataAccessPermissionResult = evaluateDataAccessPermission(accessTeamBInput);

    // TEAM_B の課題へのアクセスが拒否されることを確認
    expect(accessTeamBResult.isPermitted).toBe(false);
    expect(accessTeamBResult.permittedOperations).toEqual([]);
    expect(accessTeamBResult.dataScope).toBe('none');
    expect(accessTeamBResult.decryptionKey).toBeNull();
  });
});