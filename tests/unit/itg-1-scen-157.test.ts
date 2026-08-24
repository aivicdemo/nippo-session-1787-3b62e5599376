import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';
import { type NotificationServiceAdapter } from '../../src/logic/submission-status-tracking';

describe('sendDailyReportReminder', () => {
  // SCEN-157: [edge] リマインド通知スケジュール機能 - 定時スケジュール登録時刻がちょうど朝9時であるとき、その時刻に通知が予約される
  test('should schedule reminder notification at exactly 09:00 when scheduled time is set to morning 9:00 AM', () => {
    const mockNotificationAdapter: NotificationServiceAdapter = {
      sendReminderNotification: jest.fn(),
      scheduleNotification: jest.fn().mockResolvedValue({ success: true }),
      getDeliveryStatus: jest.fn(),
    };

    const scheduledTime = new Date('2024-01-15T09:00:00Z');
    const teamIds = ['team-001'];
    const reportDeadlineTime = new Date('2024-01-15T10:00:00Z');
    const notificationChannels: ('email' | 'in_app' | 'slack')[] = ['email'];

    const input = {
      scheduledTime,
      teamIds,
      reportDeadlineTime,
      notificationChannels,
    };

    sendDailyReportReminder(input, mockNotificationAdapter);

    expect(mockNotificationAdapter.scheduleNotification).toHaveBeenCalledTimes(1);

    const scheduleCall = (
      mockNotificationAdapter.scheduleNotification as jest.Mock
    ).mock.calls[0];
    expect(scheduleCall).toBeDefined();

    const schedulePayload = scheduleCall[0];
    expect(schedulePayload.scheduledTime).toEqual(new Date('2024-01-15T09:00:00Z'));
    expect(schedulePayload.teamIds).toEqual(['team-001']);
    expect(schedulePayload.reportDeadlineTime).toEqual(
      new Date('2024-01-15T10:00:00Z')
    );
    expect(schedulePayload.notificationChannels).toEqual(['email']);
  });
});