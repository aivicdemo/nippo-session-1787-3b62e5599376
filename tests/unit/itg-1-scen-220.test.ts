import { describe, test, expect } from '@jest/globals';
import { generateAndSendSummaryEmail } from '../../src/logic/notification-delivery';
import type { GenerateAndSendSummaryEmailInput } from '../../src/logic/notification-delivery';

describe('notification-delivery - generateAndSendSummaryEmail', () => {
  // SCEN-220
  test('should throw validation error when teamId is empty string', () => {
    const mockNotificationAdapter = {
      sendReminderNotification: jest.fn(),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    const input: GenerateAndSendSummaryEmailInput = {
      teamId: '',
      reportDate: '2024-01-15',
      managerUserId: 'manager-001',
      submittedReports: [
        {
          reporterId: 'engineer-001',
          reporterName: 'Engineer A',
          submittedAt: '2024-01-15T08:30:00Z',
          challenges: ['Database performance issue'],
        },
      ],
      unsubmittedMemberIds: ['engineer-002'],
      reportDeadlineTime: '09:00',
    };

    expect(() =>
      generateAndSendSummaryEmail(input, mockNotificationAdapter),
    ).toThrow(/チームID/);

    expect(mockNotificationAdapter.sendReminderNotification).not.toHaveBeenCalled();
  });
});