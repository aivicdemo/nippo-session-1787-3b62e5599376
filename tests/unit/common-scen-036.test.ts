import { listAvailableTeams } from '../../src/logic/team-member-selection';

describe('listAvailableTeams', () => {
  // SCEN-036
  test('should throw error when no teams are available for user', () => {
    const input = {
      userId: 'user-001',
      includeInactive: false,
    };

    expect(() => listAvailableTeams(input)).toThrow(/選択可能なチーム/);
  });
});