import { describe, test, expect, beforeEach } from '@jest/globals';
import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';
import type { SendDailyReportReminderInput, SendDailyReportReminderOutput } from '../../src/logic/submission-status-tracking';

describe('朝会報告リマインド通知 - 報告期限残り時間表示機能', () => {
  // SCEN-2568: 報告期限までの残り時間がちょうど0分（期限到達時）で「0分」と表示される
  test('SCEN-2568: 報告期限到達時点で残り時間が0分と表示される', () => {
    // Arrange
    const now = new Date('2026-08-19T10:00:00Z');
    const deadline = new Date('2026-08-19T10:00:00Z');
    
    const notificationServiceAdapterStub = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: 'sent',
        sentAt: now,
        userId: 'user-a',
      }),
      scheduleNotification: jest.fn().mockResolvedValue({ scheduled: true }),
      getDeliveryStatus: jest.fn().mockResolvedValue({ delivered: true }),
    };

    const input: SendDailyReportReminderInput = {
      scheduledTime: now,
      teamIds: ['team-001'],
      reportDeadlineTime: deadline,
      notificationChannels: ['email', 'in_app', 'slack'],
    };

    // Act
    const result = sendDailyReportReminder(input, notificationServiceAdapterStub);

    // Assert
    expect(result).toBeDefined();
    expect(result.remainingTimeMinutes).toBe(0);
    expect(result.remainingTimeMinutes).toBeGreaterThanOrEqual(0);
    expect(result.sentCount).toBeGreaterThanOrEqual(0);
    expect(result.notificationDetails).toBeDefined();
    expect(Array.isArray(result.notificationDetails)).toBe(true);
  });
});