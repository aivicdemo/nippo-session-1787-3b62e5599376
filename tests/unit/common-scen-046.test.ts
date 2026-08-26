import { authorizeScheduleOperation } from '../../src/logic/remind-notification-authorization';
import type { ScheduleOperationAuthorizationRequest, ScheduleOperationAuthorizationResult } from '../../src/logic/remind-notification-authorization';

describe('remind-notification-authorization', () => {
  // SCEN-046
  test('should deny schedule operation when user lacks remind notification management access', () => {
    const request: ScheduleOperationAuthorizationRequest = {
      userId: 'user-no-access',
      operationType: 'create',
      targetTeamId: 'team-001',
      scheduleId: null,
    };

    const result: ScheduleOperationAuthorizationResult = authorizeScheduleOperation(request);

    expect(result.authorized).toBe(false);
    expect(result.reason).toMatch(/リマインド通知スケジュール操作の権限/);
  });
});