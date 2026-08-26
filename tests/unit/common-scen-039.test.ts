import { listTeamMembers, type ListTeamMembersInput } from '../../src/logic/team-member-selection';

describe('team-member-selection', () => {
  // SCEN-039
  test('should return access denied error when user lacks permission to team', () => {
    const input: ListTeamMembersInput = {
      teamId: 'team-001',
      includeInactive: false,
    };

    expect(() => listTeamMembers(input)).toThrow(/このチームへのアクセス権限がありません/);
  });
});