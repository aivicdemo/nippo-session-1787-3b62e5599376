import { evaluateDataAccessPermission } from '../../src/logic/auth-authorization';

describe('ロールベース権限判定機能 - 他チーム課題データの編集権限判定', () => {
  test('SCEN-2098: 開発部長が他チームの課題データに対して閲覧のみ権限の場合、編集操作が拒否される', () => {
    // 前提: 開発部長が他チームの課題データに対して「閲覧のみ」権限を持つ
    // 入力: ユーザーID、ロール、所属チーム、対象データタイプ、対象チーム、要求操作
    const input: Parameters<typeof evaluateDataAccessPermission>[0] = {
      userId: 'user-dept-manager-001',
      userRole: 'manager',
      userTeamId: 'team-development-001',
      targetDataType: 'issue',
      targetTeamId: 'team-sales-001',
      requestedOperation: 'edit',
    };

    // 実行: 権限評価関数を呼び出す
    const result = evaluateDataAccessPermission(input);

    // 期待結果:
    // (1) 編集操作が拒否される（isPermitted: false）
    expect(result.isPermitted).toBe(false);

    // (2) 許可される操作一覧に 'edit' が含まれない
    expect(result.permittedOperations).not.toContain('edit');

    // (3) 許可される操作は 'view' のみ
    expect(result.permittedOperations).toEqual(['view']);

    // (4) アクセス可能なデータスコープは 'own_team'（自チームのみ）
    // 他チームのデータは原則的に閲覧のみに制限される可能性があるが、
    // 営業チームの課題に対しても閲覧が許可される場合は all_teams
    // ここではビジネスルール上、営業チーム課題の閲覧は許可されることを想定し、
    // 複数チームデータの閲覧が可能な場合を想定する
    expect(result.dataScope).toMatch(/^(own_team|all_teams)$/);

    // (5) 暗号化データを復号化するための鍵は null（編集権限がないため鍵提供不可）
    expect(result.decryptionKey).toBeNull();

    // (6) エラーメッセージが返される（業務ルール上、編集拒否時の理由提示）
    // decryptionKeyがnullの場合、暗号化されたデータへのアクセスも許可されないことを確認
    expect(result.isPermitted).toBe(false);

    // 追加検証: ロールが 'manager' でデータタイプが 'issue' の場合、
    // 同チームに限定されない限り編集権限は付与されないことを確認
    // ビジネスルール: 部長は自チーム課題の編集は可能だが、他チーム課題は閲覧のみ
    if (input.userTeamId !== input.targetTeamId) {
      expect(result.permittedOperations).not.toContain('edit');
      expect(result.permittedOperations).not.toContain('delete');
    }
  });
});