import { determineEditableFieldsByRole } from '../../src/logic/access-control-and-permissions';

describe('access-control-and-permissions', () => {
  test('SCEN-136: should throw RoleHierarchyValidationError when user role hierarchy is contradictory', () => {
    const input = {
      userId: 'user-001',
      contextRole: 'engineer',
      targetReportId: undefined,
      operationContext: 'report_input',
    };

    expect(() => determineEditableFieldsByRole(input)).toThrow(/役割設定に矛盾/);
  });
});