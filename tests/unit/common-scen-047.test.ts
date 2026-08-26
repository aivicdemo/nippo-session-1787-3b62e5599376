import { authorizeScheduleOperation, type ScheduleOperationAuthorizationRequest, type ScheduleOperationAuthorizationResult } from '../../src/logic/remind-notification-authorization';

describe('authorizeScheduleOperation', () => {
  // SCEN-047
  test('should throw error when user lacks admin permission for target team', () => {
    const request: ScheduleOperationAuthorizationRequest = {
      userId: 'user-non-admin-001',
      operationType: 'create',
      targetTeamId: 'team-001',
      scheduleId: null,
    };

    expect(() => authorizeScheduleOperation(request)).toThrow(/スケジュール操作権限/);
  });
});