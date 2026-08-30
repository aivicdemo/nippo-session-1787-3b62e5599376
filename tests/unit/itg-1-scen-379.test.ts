import { judgeAccessPermission } from '../../src/logic/access-control-and-permissions';

describe('朝会報告管理システム - アクセス権限判定', () => {
  test('SCEN-379: ユーザーの役割が未設定のときInvalidRoleErrorが発生する', () => {
    expect(() => {
      judgeAccessPermission({
        userId: 'user-001',
        resourceType: 'dashboard',
        operation: 'view',
        targetTeamId: null,
        confidentialityLevel: 'internal',
      });
    }).toThrow(/ユーザーの役割が無効です。システム管理者に連絡してください。/);
  });
});