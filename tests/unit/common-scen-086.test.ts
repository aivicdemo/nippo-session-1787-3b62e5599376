import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import type { RemindUnsubmittedParams, RemindUnsubmittedResult } from '../../src/logic/notification-delivery';
import { sendUnsubmittedReminder } from '../../src/logic/notification-delivery';

describe('notification-delivery', () => {
  // SCEN-086: Authorization denial for dashboard analysis - AI agent restricts access to director-only operations
  test('SCEN-086: sendUnsubmittedReminder denies authorization for non-director user attempting director-level data access', async () => {
    const mockNonDirectorUserId = 'user_emp_001';
    const mockNonDirectorRole = 'employee';
    const mockDirectorUserId = 'user_dir_001';
    const mockDirectorRole = 'director';

    const nonDirectorContext = {
      userId: mockNonDirectorUserId,
      userRole: mockNonDirectorRole,
      userDepartment: 'engineering',
      accessLevel: 'basic',
    };

    const directorContext = {
      userId: mockDirectorUserId,
      userRole: mockDirectorRole,
      userDepartment: 'management',
      accessLevel: 'director',
    };

    const unsubmittedUserIds = ['user_emp_002', 'user_emp_003'];
    const testTimestamp = new Date('2024-01-15T07:00:00Z');

    const paramsNonDirector: RemindUnsubmittedParams = {
      unsubmittedUserIds: unsubmittedUserIds,
      callTimestampUtc: testTimestamp,
      initiatorUserId: mockNonDirectorUserId,
      initiatorUserRole: mockNonDirectorRole,
      initiatorAccessLevel: 'basic',
    };

    const paramsDirector: RemindUnsubmittedParams = {
      unsubmittedUserIds: unsubmittedUserIds,
      callTimestampUtc: testTimestamp,
      initiatorUserId: mockDirectorUserId,
      initiatorUserRole: mockDirectorRole,
      initiatorAccessLevel: 'director',
    };

    const expectAuthorizationDeniedError = () => {
      return expect(async () => {
        await sendUnsubmittedReminder(paramsNonDirector);
      }).rejects.toThrow(/権限がありません|AuthorizationDenied/);
    };

    await expectAuthorizationDeniedError();

    const resultDirector: RemindUnsubmittedResult = await sendUnsubmittedReminder(paramsDirector);
    expect(resultDirector).toBeDefined();
    expect(resultDirector.status).toBe('sent');
    expect(resultDirector.recipientCount).toBe(2);
    expect(resultDirector.auditEventLogged).toBe(true);
    expect(resultDirector.auditEventType).toBe('reminder_sent_authorized');
  });
});