import { filterDisplayContentByRole } from '../../src/logic/access-control-and-permissions';
import { type UserContext, type FilterDisplayContentInput } from '../../src/logic/access-control-and-permissions';

describe('filterDisplayContentByRole', () => {
  // SCEN-132
  test('should throw InvalidUserRoleError when userRole is not a defined role', () => {
    const invalidRoleContext: UserContext = {
      userId: 'user-001',
      role: 'consultant' as any,
      teamId: 'team-001',
      permissionLevel: 0,
    };

    const input: FilterDisplayContentInput = {
      userContext: invalidRoleContext,
      contentType: 'dashboard',
      targetTeamId: null,
      dataSet: {},
    };

    expect(() => filterDisplayContentByRole(input)).toThrow(/ユーザー役割が無効です/);
  });
});