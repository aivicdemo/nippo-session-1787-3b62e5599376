import { sendRemindNotifications } from '../../src/logic/remind-notification-sender';

const fetchMock = require('jest-fetch-mock');

describe('remind-notification-sender', () => {
  // SCEN-018
  test('should throw error when schedule is not found', async () => {
    fetchMock.resetMocks();

    const nonExistentScheduleId = 'non-existent-schedule-id';
    const userId = 'user-001';
    const executionTimestamp = 1705315200000;

    fetchMock.mockResponseOnce(JSON.stringify(null), { status: 200 });

    await expect(
      sendRemindNotifications({
        scheduleId: nonExistentScheduleId,
        userId: userId,
        executionTimestamp: executionTimestamp,
      })
    ).rejects.toThrow(/リマインド通知スケジュールが見つかりません/);
  });
});