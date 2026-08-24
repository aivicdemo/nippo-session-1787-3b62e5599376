import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';
import type { SendDailyReportReminderInput, SendDailyReportReminderOutput, ReminderNotificationDetail } from '../../src/logic/submission-status-tracking';

describe('毎朝の定時にチームメンバーへ報告入力のリマインド通知を自動送信', () => {
  // SCEN-2885
  test('リマインド通知送信時、報告期限までの時間が正確に計算されて通知メッセージに含まれる', async () => {
    const baseDate = new Date('2024-01-15T07:00:00Z');
    const reportDeadlineTime = new Date('2024-01-15T09:00:00Z');
    const scheduledTime = baseDate;
    
    const capturedNotificationDetails: ReminderNotificationDetail[] = [];

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn(async (userId: string, message: string, channels: string[]) => {
        capturedNotificationDetails.push({
          userId,
          status: 'sent' as const,
          sentAt: baseDate,
          errorMessage: null,
        });
        return { success: true, sentAt: baseDate };
      }),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    const input: SendDailyReportReminderInput = {
      scheduledTime,
      teamIds: ['team-001'],
      reportDeadlineTime,
      notificationChannels: ['email', 'in_app', 'slack'],
    };

    const result: SendDailyReportReminderOutput = await sendDailyReportReminder(
      input,
      mockNotificationServiceAdapter as any
    );

    const remainingTimeMinutes = Math.floor((reportDeadlineTime.getTime() - baseDate.getTime()) / (1000 * 60));
    const expectedRemainingMinutes = 120;

    expect(result.remainingTimeMinutes).toBe(expectedRemainingMinutes);
    expect(remainingTimeMinutes).toBe(120);

    expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenCalled();

    const callArgs = mockNotificationServiceAdapter.sendReminderNotification.mock.calls;
    expect(callArgs.length).toBeGreaterThan(0);

    let foundAccurateTimeMessage = false;
    for (const call of callArgs) {
      const message = call[1] as string;
      if (message && message.includes('120') || message.includes('2時間') || message.includes('2 hour')) {
        foundAccurateTimeMessage = true;
        break;
      }
    }

    expect(foundAccurateTimeMessage).toBe(true);

    expect(result.sentCount).toBeGreaterThan(0);
    expect(result.failedCount).toBe(0);
    expect(result.notificationDetails).toBeDefined();
    expect(Array.isArray(result.notificationDetails)).toBe(true);
  });
});