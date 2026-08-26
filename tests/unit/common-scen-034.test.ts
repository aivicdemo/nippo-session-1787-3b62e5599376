import { listAvailableTeams } from '../../src/logic/team-member-selection';

describe('listAvailableTeams', () => {
  // SCEN-034
  test('should return permission denied error when user lacks access rights to reminder notification management screen', () => {
    const input = {
      userId: 'user-without-permission',
    };

    const result = listAvailableTeams(input);

    expect(result).toEqual({
      code: 'PERMISSION_DENIED',
      message: 'リマインド通知管理画面へのアクセス権限がありません。',
    });
  });
});