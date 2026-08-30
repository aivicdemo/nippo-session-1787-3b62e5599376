import { determineEditableFieldsByRole } from '../../src/logic/access-control-and-permissions';

describe('determineEditableFieldsByRole', () => {
  test('SCEN-135: throws InvalidUserRoleError when user role cannot be retrieved', () => {
    const userId = 'user-9999';
    const contextRole = 'engineer';
    const targetReportId = 'report-001';
    const operationContext = 'report_input';

    expect(() => {
      determineEditableFieldsByRole(userId, contextRole, targetReportId, operationContext);
    }).toThrow(/ユーザーの役割情報が取得できません/);
  });
});