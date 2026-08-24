import { describe, test, expect, beforeEach } from '@jest/globals';
import { validateUserAuthorizationAndPermission } from '../../src/logic/auth-authorization';

describe('ユーザー権限と機能アクセス制御', () => {
  // SCEN-136
  test('システム稼働状態フラグが false のとき、アクセス制御がエラーを返す', () => {
    const input = {
      userId: 'admin-user-001',
      requestedFeature: '日報入力',
      userRole: 'admin',
      userTeamId: 'team-engineering',
      systemOperationalFlag: false,
    };

    expect(() =>
      validateUserAuthorizationAndPermission(input)
    ).toThrow(/システム/);
  });
});