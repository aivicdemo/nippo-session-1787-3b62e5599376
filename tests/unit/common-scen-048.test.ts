import { authorizeScheduleOperation } from '../../src/logic/remind-notification-authorization';

describe('authorizeScheduleOperation', () => {
  // SCEN-048
  test('should return unauthorized error when user is not schedule owner and lacks team admin permission for update and delete operations', () => {
    const userIdA = 'user-a-id';
    const userIdB = 'user-b-id';
    const teamId = 'team-1-id';
    const scheduleId = 'schedule-1-id';

    const updateAuthResult = authorizeScheduleOperation({
      userId: userIdA,
      operationType: 'update',
      targetTeamId: teamId,
      scheduleId: scheduleId,
    });

    expect(updateAuthResult.authorized).toBe(false);
    expect(updateAuthResult.reason).toMatch(/このスケジュールの操作権限がありません/);

    const deleteAuthResult = authorizeScheduleOperation({
      userId: userIdA,
      operationType: 'delete',
      targetTeamId: teamId,
      scheduleId: scheduleId,
    });

    expect(deleteAuthResult.authorized).toBe(false);
    expect(deleteAuthResult.reason).toMatch(/このスケジュールの操作権限がありません/);
  });
});