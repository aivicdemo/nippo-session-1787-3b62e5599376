import { evaluateDataAccessPermission } from '../../src/logic/auth-authorization';
import { type DataAccessEvaluationInput, type DataAccessPermissionResult } from '../../src/logic/auth-authorization';

describe('ロールベース権限判定機能', () => {
  test('SCEN-2090: エンジニアロールが他のメンバーの課題データを編集しようとしたとき編集操作が拒否される', () => {
    // ユーザーA（エンジニア）がユーザーB（エンジニア）の課題データを編集しようとする場合
    const userAId = 'user-engineer-a';
    const userBTeamId = 'team-dev-001';
    
    const evaluationInput: DataAccessEvaluationInput = {
      userId: userAId,
      userRole: 'engineer',
      userTeamId: userBTeamId,
      targetDataType: 'issue',
      targetTeamId: userBTeamId,
      requestedOperation: 'edit'
    };

    const result: DataAccessPermissionResult = evaluateDataAccessPermission(evaluationInput);

    // 編集操作が拒否されることを確認
    expect(result.isPermitted).toBe(false);
    
    // 許可された操作リストに'edit'が含まれていないことを確認
    expect(result.permittedOperations).not.toContain('edit');
    
    // エンジニアロールは所属チームのみアクセス可能だが、他メンバーのデータ編集は不可
    expect(result.dataScope).toBe('own_team');
    
    // 復号化キーはnullであることを確認（権限がないため）
    expect(result.decryptionKey).toBeNull();
  });
});