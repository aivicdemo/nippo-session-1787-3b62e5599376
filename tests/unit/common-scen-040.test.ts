import { listTeamMembers } from '../../src/logic/team-member-selection';

describe('team-member-selection', () => {
  // SCEN-040
  test('should throw error when teamId is empty string', () => {
    const input = {
      teamId: '',
      includeInactive: false,
    };

    expect(() => listTeamMembers(input)).toThrow(/チームIDは必須です/);
  });
});