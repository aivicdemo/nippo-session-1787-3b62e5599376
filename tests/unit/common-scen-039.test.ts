import { listTeamMembers, type ListTeamMembersInput } from '../../src/logic/team-member-selection';

describe('team-member-selection', () => {
  // SCEN-039
  test('should return forbidden error when user lacks access permission to the specified team', () => {
    const input: ListTeamMembersInput = {
      teamId: 'team-999',
    };

    expect(() => listTeamMembers(input)).toThrow(/アクセス権限/);
  });
});