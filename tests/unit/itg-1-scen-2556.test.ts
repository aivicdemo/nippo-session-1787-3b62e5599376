import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';
import type { SendDailyReportReminderInput, SendDailyReportReminderOutput } from '../../src/logic/submission-status-tracking';

describe('Daily Report Reminder Notification - Null Deadline Handling', () => {
  let mockNotificationService: {
    sendReminderNotification: jest.Mock;
    scheduleNotification: jest.Mock;
    getDeliveryStatus: jest.Mock;
  };

  let mockAlertService: {
    generateAdminAlert: jest.Mock;
  };

  let mockDeliveryLog: {
    recordFailure: jest.Mock;
  };

  beforeEach(() => {
    mockNotificationService = {
      sendReminderNotification: jest.fn(),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    mockAlertService = {
      generateAdminAlert: jest.fn(),
    };

    mockDeliveryLog = {
      recordFailure: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-2556
  test('should handle null deadline gracefully and generate admin alert without sending notifications', async () => {
    const scheduledTime = new Date('2024-01-15T08:30:00Z');
    const reportDeadlineTime: Date | null = null;
    const teamIds = ['team-001', 'team-002'];
    const notificationChannels = ['email', 'in_app', 'slack'] as const;

    const input: SendDailyReportReminderInput = {
      scheduledTime,
      teamIds,
      reportDeadlineTime: reportDeadlineTime as any,
      notificationChannels,
    };

    let thrownError: Error | null = null;

    try {
      await sendDailyReportReminder(input, mockNotificationService);
    } catch (error) {
      thrownError = error as Error;
    }

    expect(thrownError).toBeDefined();
    expect(thrownError?.message).toMatch(/期限|deadline|null|invalid/i);

    expect(mockNotificationService.sendReminderNotification).not.toHaveBeenCalled();

    expect(mockDeliveryLog.recordFailure).not.toHaveBeenCalled();
  });
});