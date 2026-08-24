import { describe, test, expect, beforeEach } from '@jest/globals';
import { fetchYesterdayReport } from '../../src/logic/report-submission';

describe('fetchYesterdayReport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-2686
  test('should throw error when teamId is empty string', async () => {
    const engineerId = 'engineer-001';
    const targetDate = new Date('2024-01-15');
    const requestingUserId = 'user-001';
    const teamId = '';

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn(),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    expect(() =>
      fetchYesterdayReport(
        {
          engineerId,
          targetDate,
          requestingUserId,
          teamId,
        },
        mockNotificationServiceAdapter
      )
    ).toThrow(/チームID/);
  });
});