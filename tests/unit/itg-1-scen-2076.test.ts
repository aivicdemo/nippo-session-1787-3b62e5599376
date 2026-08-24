import { evaluateDataAccessPermission } from '../../src/logic/auth-authorization';

describe('ロールベース権限判定機能', () => {
  // SCEN-2076: [normal] ロールベース権限判定機能 - 課題データが1件のとき、権限があれば1件のみ表示される
  test('課題データが1件のとき、権限があれば1件のみ表示される', () => {
    const test_user_id = 'user_001';
    const test_user_role = 'engineer' as const;
    const test_user_team_id = 'team_001';
    const target_issue_data_type = 'issue' as const;
    const target_team_id = 'team_001';
    const requested_view_operation = 'view' as const;

    const result = evaluateDataAccessPermission({
      userId: test_user_id,
      userRole: test_user_role,
      userTeamId: test_user_team_id,
      targetDataType: target_issue_data_type,
      targetTeamId: target_team_id,
      requestedOperation: requested_view_operation,
    });

    expect(result.isPermitted).toBe(true);
    expect(result.permittedOperations).toContain('view');
    expect(result.dataScope).toBe('own_team');
    expect(result.decryptionKey).not.toBeNull();
  });
});