import { authorizeScheduleOperation, type ScheduleOperationAuthorizationRequest, type ScheduleOperationAuthorizationResult } from '../../src/logic/remind-notification-authorization';

describe('authorizeScheduleOperation', () => {
  // SCEN-045
  test('should authorize MEMBER user to create schedule operation', () => {
    const request: ScheduleOperationAuthorizationRequest = {
      userId: 'user001',
      operationType: 'create',
      targetTeamId: 'team001',
      scheduleId: null,
    };

    const result: ScheduleOperationAuthorizationResult = authorizeScheduleOperation(request);

    expect(result.authorized).toBe(true);
  });
});