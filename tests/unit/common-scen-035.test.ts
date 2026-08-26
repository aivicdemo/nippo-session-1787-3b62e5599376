import { listAvailableTeams, type ListAvailableTeamsInput } from '../../src/logic/team-member-selection';

describe('team-member-selection', () => {
  // SCEN-035
  test('should return error when team information fetch fails', async () => {
    const input: ListAvailableTeamsInput = {
      userId: 'user123',
      includeInactive: false,
    };

    const error = new Error('Database connection failed');

    jest.spyOn(global, 'fetch').mockRejectedValueOnce(error);

    await expect(listAvailableTeams(input)).rejects.toThrow(/チーム一覧の取得に失敗しました/);

    jest.restoreAllMocks();
  });
});