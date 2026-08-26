import { listTeamMembers, type ListTeamMembersInput } from '../../src/logic/team-member-selection';

describe('team-member-selection', () => {
  // SCEN-038
  test('should throw error when team does not exist', async () => {
    const input: ListTeamMembersInput = {
      teamId: 'non-existent-team-999',
    };

    await expect(listTeamMembers(input)).rejects.toThrow(/チームが見つかりません/);
  });
});