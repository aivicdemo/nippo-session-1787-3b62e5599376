import { initializeScheduler } from '../../src/logic/remind-notification-scheduler';

const fetchMock = require('jest-fetch-mock');

describe('RemindNotificationScheduler', () => {
  test('SCEN-050', async () => {
    fetchMock.resetMocks();
    
    fetchMock.mockResponseOnce(
      JSON.stringify({ error: 'Database connection failed' }),
      { status: 500 }
    );

    await expect(initializeScheduler()).rejects.toThrow(/リマインド通知スケジュール/);
  });
});