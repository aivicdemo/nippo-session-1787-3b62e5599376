import { evaluateDataAccessPermission } from '../../src/logic/auth-authorization';

describe('ロールベース権限判定機能 - 経営層による全チーム課題データ削除', () => {
  test('SCEN-2099: 経営層が全チームの課題データに対して削除権限を持つ場合、削除操作が許可される', () => {
    // Arrange: 経営層ユーザー（最高権限）による全チーム課題削除の権限判定
    const input: DataAccessEvaluationInput = {
      userId: 'executive-001',
      userRole: 'admin',
      userTeamId: 'team-executive',
      targetDataType: 'issue',
      targetTeamId: 'team-a',
      requestedOperation: 'delete',
    };

    // Act: 権限判定を実行
    const result = evaluateDataAccessPermission(input);

    // Assert: 経営層（最高権限）ユーザーに対して削除操作が許可されることを検証
    expect(result.isPermitted).toBe(true);
    expect(result.permittedOperations).toContain('delete');
    expect(result.dataScope).toBe('all_teams');
    expect(result.decryptionKey).not.toBeNull();
  });
});