import { evaluateDataAccessPermission } from '../../src/logic/auth-authorization';

describe('ロールベース権限判定機能 - 複数課題の権限評価順序独立性', () => {
  test('SCEN-2104: 権限評価順序が逆順でも同じ結果が得られる', () => {
    // 入力: テストデータとして3件の課題データを準備
    const issueA = {
      issueId: 'ISSUE-A',
      requiredOperation: 'view' as const,
    };

    const issueB = {
      issueId: 'ISSUE-B',
      requiredOperation: 'edit' as const,
    };

    const issueC = {
      issueId: 'ISSUE-C',
      requiredOperation: 'delete' as const,
    };

    // テストユーザー: 編集権限のみを持つ
    const userInput = {
      userId: 'user-001',
      userRole: 'engineer' as const,
      userTeamId: 'team-001',
      targetDataType: 'issue' as const,
      targetTeamId: 'team-001',
    };

    // 通常順（昇順）での権限評価結果
    const resultNormalOrderA = evaluateDataAccessPermission({
      ...userInput,
      requestedOperation: issueA.requiredOperation,
    });

    const resultNormalOrderB = evaluateDataAccessPermission({
      ...userInput,
      requestedOperation: issueB.requiredOperation,
    });

    const resultNormalOrderC = evaluateDataAccessPermission({
      ...userInput,
      requestedOperation: issueC.requiredOperation,
    });

    // 逆順（降順）での権限評価結果を取得
    // （実装側で逆順評価を行っても同じ結果となることを確認）
    const resultReverseOrderC = evaluateDataAccessPermission({
      ...userInput,
      requestedOperation: issueC.requiredOperation,
    });

    const resultReverseOrderB = evaluateDataAccessPermission({
      ...userInput,
      requestedOperation: issueB.requiredOperation,
    });

    const resultReverseOrderA = evaluateDataAccessPermission({
      ...userInput,
      requestedOperation: issueA.requiredOperation,
    });

    // 期待結果: 課題A（閲覧権限）は成功
    expect(resultNormalOrderA.isPermitted).toBe(true);
    expect(resultNormalOrderA.permittedOperations).toContain('view');
    expect(resultNormalOrderA.dataScope).toBe('own_team');
    expect(resultNormalOrderA.decryptionKey).not.toBeNull();

    // 期待結果: 課題B（編集権限）は成功
    expect(resultNormalOrderB.isPermitted).toBe(true);
    expect(resultNormalOrderB.permittedOperations).toContain('edit');
    expect(resultNormalOrderB.dataScope).toBe('own_team');
    expect(resultNormalOrderB.decryptionKey).not.toBeNull();

    // 期待結果: 課題C（削除権限）は失敗（権限不足）
    expect(resultNormalOrderC.isPermitted).toBe(false);
    expect(resultNormalOrderC.permittedOperations).not.toContain('delete');
    expect(resultNormalOrderC.dataScope).toBe('none');
    expect(resultNormalOrderC.decryptionKey).toBeNull();

    // 逆順評価の結果が通常順と同一であることを確認
    expect(resultReverseOrderA.isPermitted).toBe(resultNormalOrderA.isPermitted);
    expect(resultReverseOrderA.permittedOperations).toEqual(
      resultNormalOrderA.permittedOperations
    );
    expect(resultReverseOrderA.dataScope).toBe(resultNormalOrderA.dataScope);
    expect(resultReverseOrderA.decryptionKey).toBe(
      resultNormalOrderA.decryptionKey
    );

    expect(resultReverseOrderB.isPermitted).toBe(resultNormalOrderB.isPermitted);
    expect(resultReverseOrderB.permittedOperations).toEqual(
      resultNormalOrderB.permittedOperations
    );
    expect(resultReverseOrderB.dataScope).toBe(resultNormalOrderB.dataScope);
    expect(resultReverseOrderB.decryptionKey).toBe(
      resultNormalOrderB.decryptionKey
    );

    expect(resultReverseOrderC.isPermitted).toBe(resultNormalOrderC.isPermitted);
    expect(resultReverseOrderC.permittedOperations).toEqual(
      resultNormalOrderC.permittedOperations
    );
    expect(resultReverseOrderC.dataScope).toBe(resultNormalOrderC.dataScope);
    expect(resultReverseOrderC.decryptionKey).toBe(
      resultNormalOrderC.decryptionKey
    );

    // 権限判定ロジックが順序に依存していないことを確認
    // エンジニアロールで所属チームのデータに対する操作権限は一貫している
    expect(resultNormalOrderA.isPermitted).toBe(true);
    expect(resultNormalOrderB.isPermitted).toBe(true);
    expect(resultNormalOrderC.isPermitted).toBe(false);
  });
});