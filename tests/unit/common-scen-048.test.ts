import { authorizeScheduleOperation, type ScheduleOperationAuthorizationRequest, type ScheduleOperationAuthorizationResult } from '../../src/logic/remind-notification-authorization';

describe('remind-notification-authorization', () => {
  // SCEN-048
  test('should return authorization error when non-owner user without team admin role attempts update and delete operations', () => {
    const userA_Id = 'user-a-123';
    const userB_Id = 'user-b-456';
    const teamId = 'team-001';
    const scheduleId = 'schedule-789';

    const updateRequest: ScheduleOperationAuthorizationRequest = {
      userId: userA_Id,
      operationType: 'update',
      targetTeamId: teamId,
      scheduleId: scheduleId,
    };

    const deleteRequest: ScheduleOperationAuthorizationRequest = {
      userId: userA_Id,
      operationType: 'delete',
      targetTeamId: teamId,
      scheduleId: scheduleId,
    };

    const updateResult: ScheduleOperationAuthorizationResult = authorizeScheduleOperation(updateRequest);

    expect(updateResult.authorized).toBe(false);
    expect(updateResult.reason).toMatch(/このスケジュールの操作権限がありません/);

    const deleteResult: ScheduleOperationAuthorizationResult = authorizeScheduleOperation(deleteRequest);

    expect(deleteResult.authorized).toBe(false);
    expect(deleteResult.reason).toMatch(/このスケジュールの操作権限がありません/);
  });
});