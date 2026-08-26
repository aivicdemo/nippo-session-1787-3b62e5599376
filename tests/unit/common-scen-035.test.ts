import { listAvailableTeams } from '../../src/logic/team-member-selection';

describe('Team Member Selection - listAvailableTeams', () => {
  // SCEN-035
  test('should return team fetch failed error when team information retrieval fails', async () => {
    const fetchMock = require('jest-fetch-mock');
    fetchMock.enableMocks();
    fetchMock.resetMocks();

    const input = {
      userId: 'user123',
    };

    fetchMock.mockResponseOnce(JSON.stringify({}), { status: 500 });

    const result = await listAvailableTeams(input);

    expect(result).toEqual({
      code: 'TEAM_FETCH_FAILED',
      message: 'チーム一覧の取得に失敗しました。',
    });
  });
});