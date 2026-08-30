import { judgeAccessPermission } from '../../src/logic/access-control-and-permissions';

describe('Access Control and Permissions', () => {
  test('SCEN-521: throws error when operation is not view/edit/delete/export', () => {
    const userId = 'user-123';
    const resourceType = 'report' as const;
    const operation = 'export' as const;
    const targetTeamId = 'team-A';
    const confidentialityLevel = 'internal' as const;

    expect(() =>
      judgeAccessPermission({
        userId,
        resourceType,
        operation,
        targetTeamId,
        confidentialityLevel,
      })
    ).toThrow(/不正な操作/);
  });
});