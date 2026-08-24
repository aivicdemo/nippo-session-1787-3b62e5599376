import { validateUserAuthorizationAndPermission } from '../../src/logic/auth-authorization';
import { type AuthorizationCheckInput, type AuthorizationCheckResult } from '../../src/logic/auth-authorization';

describe('朝会報告管理システム - ロール別アクセス制御', () => {
  // SCEN-121: [normal] ロール別アクセス制御機能 - エンジニアロールのユーザーが日報入力フォームにアクセスしたとき、入力用UIが表示される
  test('エンジニアロールのユーザーが日報入力画面へのアクセスを要求すると、アクセス権限が付与される', () => {
    const input: AuthorizationCheckInput = {
      userId: 'user-001-engineer',
      requestedFeature: '日報入力',
      targetTeamId: 'team-development-01',
      targetDataType: '自分の進捗のみ',
    };

    const result: AuthorizationCheckResult = validateUserAuthorizationAndPermission(input);

    expect(result.isAuthorized).toBe(true);
    expect(result.userRole).toBe('engineer');
    expect(result.allowedDataScope).toBe('自分のみ');
    expect(result.editableFeatures).toContain('日報入力');
    expect(result.editableFeatures).toContain('昨日やったこと入力');
    expect(result.editableFeatures).toContain('今日やること入力');
    expect(result.editableFeatures).toContain('抱えている課題入力');
    expect(result.editableFeatures).toContain('日報送信');
  });
});