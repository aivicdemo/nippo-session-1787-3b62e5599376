import { evaluateDataAccessPermission } from '../../src/logic/auth-authorization';

describe('ロールベース権限判定機能 - 開発部長が自チーム内の全課題データを閲覧できる', () => {
  // SCEN-2069
  test('開発部長が所属チーム内の全課題データに対して閲覧権限を持ち、別チーム課題にはアクセス不可', () => {
    // 開発部長ユーザーコンテキスト
    const deptLeadUserId = 'dept_lead_001';
    const deptLeadRole = 'manager';
    const devTeamId = 'dev_team_001';
    const salesTeamId = 'sales_team_001';

    // テスト1: 開発部長が自チーム内の課題（issue）を閲覧する権限を持つ
    const accessEvaluationInput1 = {
      userId: deptLeadUserId,
      userRole: 'manager' as const,
      userTeamId: devTeamId,
      targetDataType: 'issue' as const,
      targetTeamId: devTeamId,
      requestedOperation: 'view' as const,
    };

    const result1 = evaluateDataAccessPermission(accessEvaluationInput1);

    expect(result1.isPermitted).toBe(true);
    expect(result1.permittedOperations).toContain('view');
    expect(result1.dataScope).toBe('own_team');
    expect(result1.decryptionKey).not.toBeNull();

    // テスト2: 開発部長が別チーム（sales_team_001）の課題にアクセスしようとする
    const accessEvaluationInput2 = {
      userId: deptLeadUserId,
      userRole: 'manager' as const,
      userTeamId: devTeamId,
      targetDataType: 'issue' as const,
      targetTeamId: salesTeamId,
      requestedOperation: 'view' as const,
    };

    const result2 = evaluateDataAccessPermission(accessEvaluationInput2);

    expect(result2.isPermitted).toBe(false);
    expect(result2.dataScope).toBe('none');
    expect(result2.decryptionKey).toBeNull();

    // テスト3: 開発部長が自チーム内の課題を編集する権限を持つ
    const accessEvaluationInput3 = {
      userId: deptLeadUserId,
      userRole: 'manager' as const,
      userTeamId: devTeamId,
      targetDataType: 'issue' as const,
      targetTeamId: devTeamId,
      requestedOperation: 'edit' as const,
    };

    const result3 = evaluateDataAccessPermission(accessEvaluationInput3);

    expect(result3.isPermitted).toBe(true);
    expect(result3.permittedOperations).toContain('edit');
    expect(result3.dataScope).toBe('own_team');

    // テスト4: 開発部長が自チーム内の課題を削除する権限を持つ
    const accessEvaluationInput4 = {
      userId: deptLeadUserId,
      userRole: 'manager' as const,
      userTeamId: devTeamId,
      targetDataType: 'issue' as const,
      targetTeamId: devTeamId,
      requestedOperation: 'delete' as const,
    };

    const result4 = evaluateDataAccessPermission(accessEvaluationInput4);

    expect(result4.isPermitted).toBe(true);
    expect(result4.permittedOperations).toContain('delete');
    expect(result4.dataScope).toBe('own_team');
  });
});