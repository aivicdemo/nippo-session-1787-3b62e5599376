import { determineEditableFieldsByRole, type DetermineEditableFieldsInput, type EditableFieldsPermissionResult } from '../../src/logic/access-control-and-permissions';

describe('access-control-and-permissions', () => {
  test('SCEN-134: [normal] determineEditableFieldsByRole processes representative valid input correctly', () => {
    const input: DetermineEditableFieldsInput = {
      userId: 'USR001',
      contextRole: 'engineer',
      targetReportId: undefined,
      operationContext: 'report_input'
    };

    const result: EditableFieldsPermissionResult = determineEditableFieldsByRole(input);

    expect(result.isAuthorized).toBe(true);
    expect(result.editableFields).toEqual(['実績', '課題', '予定']);
    expect(result.readOnlyFields).toEqual(['優先度', '対策計画']);
    expect(result.restrictionReason).toBeUndefined();
  });
});