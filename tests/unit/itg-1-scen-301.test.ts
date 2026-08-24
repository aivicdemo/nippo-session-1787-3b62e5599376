import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';
import type { SendDailyReportReminderInput, SendDailyReportReminderOutput, ReminderNotificationDetail } from '../../src/logic/submission-status-tracking';

describe('Daily Report Reminder Notification - First Business Day of Month', () => {
  let realDateNow: () => number;
  let mockNotificationAdapter: {
    sendReminderNotification: jest.Mock;
    scheduleNotification: jest.Mock;
    getDeliveryStatus: jest.Mock;
  };

  beforeEach(() => {
    realDateNow = Date.now;
    mockNotificationAdapter = {
      sendReminderNotification: jest.fn(),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };
  });

  afterEach(() => {
    Date.now = realDateNow;
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  // SCEN-301
  test('should send reminder notifications to all team members on first business day of month at scheduled time', async () => {
    const firstBusinessDayOfMonth = new Date('2026-09-01T09:00:00+09:00');
    const scheduledTime = new Date('2026-09-01T09:00:00+09:00');
    const reportDeadlineTime = new Date('2026-09-01T09:30:00+09:00');
    const teamIds = ['team-001'];
    const notificationChannels: ('email' | 'in_app' | 'slack')[] = ['email', 'slack'];

    const mockTeamMembers = [
      { userId: 'user-001', userName: 'Engineer A', email: 'a@example.com' },
      { userId: 'user-002', userName: 'Engineer B', email: 'b@example.com' },
      { userId: 'user-003', userName: 'Engineer C', email: 'c@example.com' },
      { userId: 'user-004', userName: 'Engineer D', email: 'd@example.com' },
      { userId: 'user-005', userName: 'Engineer E', email: 'e@example.com' },
      { userId: 'user-006', userName: 'Engineer F', email: 'f@example.com' },
      { userId: 'user-007', userName: 'Engineer G', email: 'g@example.com' },
      { userId: 'user-008', userName: 'Engineer H', email: 'h@example.com' },
      { userId: 'user-009', userName: 'Engineer I', email: 'i@example.com' },
      { userId: 'user-010', userName: 'Engineer J', email: 'j@example.com' },
    ];

    mockNotificationAdapter.sendReminderNotification.mockImplementation(
      async (userId: string) => ({
        userId,
        status: 'sent' as const,
        sentAt: new Date(firstBusinessDayOfMonth),
        errorMessage: null,
      })
    );

    mockNotificationAdapter.scheduleNotification.mockResolvedValue({
      scheduledId: 'sched-001',
      scheduledTime: firstBusinessDayOfMonth,
      status: 'scheduled',
    });

    jest.useFakeTimers();
    const fakeNow = firstBusinessDayOfMonth.getTime();
    jest.setSystemTime(fakeNow);

    const input: SendDailyReportReminderInput = {
      scheduledTime,
      teamIds,
      reportDeadlineTime,
      notificationChannels,
    };

    const result: SendDailyReportReminderOutput = await sendDailyReportReminder(
      input,
      mockNotificationAdapter as any
    );

    expect(mockNotificationAdapter.sendReminderNotification).toHaveBeenCalledTimes(10);

    mockTeamMembers.forEach((member) => {
      expect(mockNotificationAdapter.sendReminderNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: member.userId,
          channels: notificationChannels,
        })
      );
    });

    expect(result.sentCount).toBe(10);
    expect(result.failedCount).toBe(0);
    expect(result.remainingTimeMinutes).toBe(30);

    const sentDetails = result.notificationDetails.filter(
      (detail: ReminderNotificationDetail) => detail.status === 'sent'
    );
    expect(sentDetails).toHaveLength(10);

    sentDetails.forEach((detail: ReminderNotificationDetail) => {
      expect(detail.sentAt).toBeDefined();
      expect(detail.errorMessage).toBeNull();
    });

    expect(result.notificationDetails).toHaveLength(10);
  });
});