import { sendRemindNotifications, type SendRemindNotificationsInput, type SendRemindNotificationsOutput } from '../../src/logic/remind-notification-sender';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

describe('sendRemindNotifications', () => {
  // SCEN-017
  test('should send reminder notifications to all team members and record results successfully', async () => {
    fetchMock.resetMocks();

    const scheduleId = 'schedule-001';
    const userId = 'user-admin-001';
    const executionTimestamp = 1705317600000; // 2024-01-15T09:00:00Z

    const input: SendRemindNotificationsInput = {
      scheduleId,
      userId,
      executionTimestamp,
    };

    const memberCount = 10;
    const mailSendIds = Array.from({ length: memberCount }, (_, i) => `mail-id-${i + 1}`);

    // Stub external mail service API
    for (let i = 0; i < memberCount; i++) {
      fetchMock.mockResponseOnce(
        JSON.stringify({
          messageId: mailSendIds[i],
          status: 'sent',
          timestamp: executionTimestamp,
        }),
        { status: 200 }
      );
    }

    // Stub database record creation
    fetchMock.mockResponseOnce(
      JSON.stringify({
        recordIds: Array.from({ length: memberCount }, (_, i) => `record-${i + 1}`),
      }),
      { status: 200 }
    );

    const result: SendRemindNotificationsOutput = await sendRemindNotifications(input);

    expect(result.scheduleId).toBe(scheduleId);
    expect(result.totalCount).toBe(memberCount);
    expect(result.successCount).toBe(memberCount);
    expect(result.failureCount).toBe(0);
  });
});