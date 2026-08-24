import { validateUserAuthorizationAndPermission } from '../../src/logic/auth-authorization';
import { type AuthorizationCheckInput, type AuthorizationCheckResult } from '../../src/logic/auth-authorization';

describe('ロール別アクセス制御機能', () => {
  // SCEN-122
  test('部長ロールのユーザーが日報入力フォームにアクセスしたとき、ダッシュボード閲覧用UIが表示される', () => {
    // Arrange: 部長ロールのユーザーが日報入力フォーム(/report/input)へのアクセスを試みる
    const authorizationCheckInput: AuthorizationCheckInput = {
      userId: 'user-manager-001',
      requestedFeature: '日報入力',
      targetTeamId: 'team-dev-001',
      targetDataType: '自分の進捗のみ'
    };

    // Act: アクセス制御ロジックを実行
    const result: AuthorizationCheckResult = validateUserAuthorizationAndPermission(authorizationCheckInput);

    // Assert: 部長ロールのユーザーは日報入力フォームへのアクセスが拒否され、
    // ダッシュボード閲覧のみ許可されることを検証
    expect(result.isAuthorized).toBe(false);
    expect(result.userRole).toBe('manager');
    expect(result.allowedDataScope).toBe('自チームのみ');
    expect(result.editableFeatures).toEqual(['ダッシュボード表示', '課題検索']);
    expect(result.editableFeatures).not.toContain('日報入力');
  });
});