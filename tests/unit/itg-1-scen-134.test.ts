import { describe, test, expect } from '@jest/globals';
import { validateUserAuthorizationAndPermission } from '../../src/logic/auth-authorization';

describe('ユーザー役割による機能アクセス制御', () => {
  test('SCEN-134: エンジニア役割が部長専用ダッシュボード表示をリクエストしたとき、アクセス拒否エラーを返す', () => {
    const input = {
      userId: 'engineer@example.com',
      requestedFeature: 'dashboard/executive',
      targetTeamId: 'team-001',
      targetDataType: 'all_teams_overview'
    };

    expect(() => {
      validateUserAuthorizationAndPermission(input);
    }).toThrow(/権限/);
  });
});