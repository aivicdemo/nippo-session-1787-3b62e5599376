import { evaluateDataAccessPermission } from '../../src/logic/auth-authorization';

describe('ロールベース権限判定機能 - データアクセス権限の制御', () => {
  // SCEN-2073
  test('開発部長が他チームの課題データにはアクセス権がない場合、その範囲のデータのみ表示される', () => {
    // Arrange: テストデータベース設定
    // 開発部長ユーザーA（所属: 開発チームX）
    const userIdA = 'user-manager-001';
    const userRole = 'manager';
    const userTeamId = 'team-X';

    // 開発チームXの課題（3件）
    const teamXIssueId1 = 'issue-X-001';
    const teamXIssueId2 = 'issue-X-002';
    const teamXIssueId3 = 'issue-X-003';
    const targetTeamIdX = 'team-X';

    // 他チームYの課題（3件）
    const teamYIssueId1 = 'issue-Y-001';
    const targetTeamIdY = 'team-Y';

    // Act & Assert: 同一チーム（開発チームX）の課題へのアクセス権判定
    const resultSameTeamIssue = evaluateDataAccessPermission({
      userId: userIdA,
      userRole,
      userTeamId,
      targetDataType: 'issue',
      targetTeamId: targetTeamIdX,
      requestedOperation: 'view',
    });

    // 同一チームの課題は view 権限あり
    expect(resultSameTeamIssue.isPermitted).toBe(true);
    expect(resultSameTeamIssue.permittedOperations).toContain('view');
    expect(resultSameTeamIssue.dataScope).toBe('own_team');
    expect(resultSameTeamIssue.decryptionKey).not.toBeNull();

    // Act & Assert: 他チーム（チームY）の課題へのアクセス権判定
    const resultOtherTeamIssue = evaluateDataAccessPermission({
      userId: userIdA,
      userRole,
      userTeamId,
      targetDataType: 'issue',
      targetTeamId: targetTeamIdY,
      requestedOperation: 'view',
    });

    // 他チームの課題は view 権限なし
    expect(resultOtherTeamIssue.isPermitted).toBe(false);
    expect(resultOtherTeamIssue.permittedOperations).toHaveLength(0);
    expect(resultOtherTeamIssue.dataScope).toBe('none');
    expect(resultOtherTeamIssue.decryptionKey).toBeNull();

    // Act & Assert: 詳細ページへのアクセス試行時も権限不足による拒否
    const resultDetailAccess = evaluateDataAccessPermission({
      userId: userIdA,
      userRole,
      userTeamId,
      targetDataType: 'issue',
      targetTeamId: targetTeamIdY,
      requestedOperation: 'view',
    });

    // 権限なしの状態で詳細へのアクセスも許可されない
    expect(resultDetailAccess.isPermitted).toBe(false);
    expect(resultDetailAccess.permittedOperations).toEqual([]);
    expect(resultDetailAccess.decryptionKey).toBeNull();
  });
});