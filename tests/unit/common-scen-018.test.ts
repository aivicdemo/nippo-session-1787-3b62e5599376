import { sendRemindNotifications } from '../../src/logic/remind-notification-sender';

const fetchMock = require('jest-fetch-mock');

describe('共通', () => {
  // SCEN-018
  test('指定されたスケジュールIDが存在しない場合、リマインド通知スケジュールが見つかりませんというエラーがスローされる', () => {
    fetchMock.resetMocks();

    const nonExistentScheduleId = 'non-existent-schedule-id';
    const userId = 'user-001';
    const executionTimestamp = 1705318800000;

    fetchMock.mockResponseOnce(JSON.stringify(null), { status: 200 });

    const input = {
      scheduleId: nonExistentScheduleId,
      userId: userId,
      executionTimestamp: executionTimestamp,
    };

    expect(() => sendRemindNotifications(input)).toThrow(/リマインド通知スケジュールが見つかりません/);
  });
});