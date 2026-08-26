import { sendRemindNotifications, type SendRemindNotificationsInput, type SendRemindNotificationsOutput } from '../../src/logic/remind-notification-sender';

describe('sendRemindNotifications', () => {
  // SCEN-019
  test('should return failure count and throw error when notification service fails', async () => {
    const input: SendRemindNotificationsInput = {
      scheduleId: 'schedule-001',
      userId: 'user-admin-001',
      executionTimestamp: 1705316400000,
    };

    // Mock fetch to simulate notification service failure
    const fetchMock = require('jest-fetch-mock');
    fetchMock.enableMocks();
    fetchMock.resetMocks();

    // Simulate notification service error response
    fetchMock.mockResponseOnce(JSON.stringify({ error: 'Service unavailable' }), { status: 500 });

    expect(() => sendRemindNotifications(input)).toThrow(/通知送信に失敗/);
  });
});