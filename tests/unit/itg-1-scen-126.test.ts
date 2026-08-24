import { describe, test, expect } from '@jest/globals';
import { validateUserAuthorizationAndPermission } from '../../src/logic/auth-authorization';

describe('課題の優先度を色分けで表示するダッシュボード機能', () => {
  // SCEN-126: [normal] ロール別アクセス制御機能 - エンジニアロールのユーザーが部長向けダッシュボードにアクセスしようとしたとき、ダッシュボード表示が制限される
  test('エンジニアロールのユーザーが部長向けダッシュボードへのアクセスを試みたとき、HTTP 403が返却され、アクセスが拒否される', () => {
    const input = {
      userId: 'engineer-user-001',
      requestedFeature: 'dashboard_director_view',
      targetTeamId: 'team-dev-001',
      targetDataType: 'all_teams_summary'
    };

    const result = validateUserAuthorizationAndPermission(
      input.userId,
      input.requestedFeature,
      input.targetTeamId,
      input.targetDataType,
      'engineer'
    );

    expect(result).toEqual({
      isAuthorized: false,
      userRole: 'engineer',
      allowedDataScope: 'own_team',
      editableFeatures: []
    });
    expect(result.isAuthorized).toBe(false);
    expect(result.userRole).toBe('engineer');
    expect(result.allowedDataScope).toBe('own_team');
    expect(result.editableFeatures.length).toBe(0);
  });
});