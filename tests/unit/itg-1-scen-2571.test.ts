import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';
import type { SendDailyReportReminderInput, SendDailyReportReminderOutput, ReminderNotificationDetail } from '../../src/logic/submission-status-tracking';

// Mock adapter interface
interface NotificationServiceAdapter {
  sendReminderNotification: jest.MockedFunction<
    (userId: string, message: string, channels: Array<'email' | 'in_app' | 'slack'>) => Promise<{ status: 'sent' | 'failed'; sentAt?: Date; errorMessage?: string }>
  >;
  scheduleNotification: jest.MockedFunction<
    (config: { time: Date; teamIds: string[]; channels: Array<'email' | 'in_app' | 'slack'> }) => Promise<{ scheduled: boolean; scheduleId: string }>
  >;
  getDeliveryStatus: jest.MockedFunction<
    (notificationId: string) => Promise<{ status: 'sent' | 'failed' | 'pending' }>
  >;
}

describe('SendDailyReportReminder - 月末31日の定時リマインド通知送信', () => {
  let mockNotificationAdapter: NotificationServiceAdapter;
  let originalDateNow: typeof Date.now;
  let currentMockTime: Date;

  beforeEach(() => {
    mockNotificationAdapter = {
      sendReminderNotification: jest.fn(),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    originalDateNow = Date.now;
    currentMockTime = new Date('2026-03-31T09:00:00Z');

    global.Date.now = jest.fn(() => currentMockTime.getTime());
    (global.Date as any).prototype.getTime = jest.fn(function () {
      return this.valueOf();
    });
  });

  afterEach(() => {
    global.Date.now = originalDateNow;
    jest.restoreAllMocks();
  });

  // SCEN-2571
  it('should send reminder notifications to all 10 team members on month-end day (31st) at scheduled time', async () => {
    const scheduledTime = new Date('2026-03-31T09:00:00Z');
    const reportDeadlineTime = new Date('2026-03-31T10:00:00Z');
    const teamIds = ['team-001'];
    const notificationChannels: Array<'email' | 'in_app' | 'slack'> = ['email', 'in_app', 'slack'];

    const mockTeamMembers = Array.from({ length: 10 }, (_, i) => ({
      userId: `user-${String(i + 1).padStart(3, '0')}`,
      userName: `Engineer ${i + 1}`,
      email: `engineer${i + 1}@example.com`,
    }));

    mockNotificationAdapter.sendReminderNotification.mockImplementation(async (userId: string) => ({
      status: 'sent',
      sentAt: new Date('2026-03-31T09:00:00Z'),
    }));

    mockNotificationAdapter.scheduleNotification.mockResolvedValue({
      scheduled: true,
      scheduleId: 'schedule-001',
    });

    const input: SendDailyReportReminderInput = {
      scheduledTime,
      teamIds,
      reportDeadlineTime,
      notificationChannels,
    };

    const output: SendDailyReportReminderOutput = await sendDailyReportReminder(input, mockNotificationAdapter);

    expect(output.sentCount).toBe(10);
    expect(output.failedCount).toBe(0);
    expect(output.remainingTimeMinutes).toBe(60);

    expect(mockNotificationAdapter.sendReminderNotification).toHaveBeenCalledTimes(10);

    mockTeamMembers.forEach((member) => {
      expect(mockNotificationAdapter.sendReminderNotification).toHaveBeenCalledWith(
        expect.stringContaining(member.userId),
        expect.any(String),
        notificationChannels,
      );
    });

    const notificationDetails: ReminderNotificationDetail[] = output.notificationDetails;
    expect(notificationDetails).toHaveLength(10);

    notificationDetails.forEach((detail) => {
      expect(detail.status).toBe('sent');
      expect(detail.sentAt).toEqual(new Date('2026-03-31T09:00:00Z'));
      expect(detail.errorMessage).toBeUndefined();
    });

    const allSentDetails = notificationDetails.filter((d) => d.status === 'sent');
    expect(allSentDetails).toHaveLength(10);
  });
});