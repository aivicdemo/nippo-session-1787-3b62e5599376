import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';
import { type SendDailyReportReminderInput, type SendDailyReportReminderOutput } from '../../src/logic/submission-status-tracking';

describe('朝会報告リマインド通知送信機能', () => {
  // SCEN-277
  test('通知に含まれる期限までの残り時間が正確に計算される', () => {
    // Arrange
    const mockNotificationPayloads: Array<{
      userId: string;
      remainingMinutes: number;
      [key: string]: unknown;
    }> = [];

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn(async (payload: {
        userId: string;
        remainingMinutes: number;
        [key: string]: unknown;
      }) => {
        mockNotificationPayloads.push(payload);
        return {
          status: 'sent' as const,
          sentAt: new Date('2025-01-15T08:00:00Z'),
        };
      }),
      scheduleNotification: jest.fn(async () => ({ success: true })),
      getDeliveryStatus: jest.fn(async () => ({ delivered: true })),
    };

    const scheduledTime = new Date('2025-01-15T08:00:00Z');
    const reportDeadlineTime = new Date('2025-01-15T09:30:00Z');
    const teamIds = ['team-001'];
    const notificationChannels: ('email' | 'in_app' | 'slack')[] = ['email'];

    const input: SendDailyReportReminderInput = {
      scheduledTime,
      teamIds,
      reportDeadlineTime,
      notificationChannels,
    };

    // Act
    const result = sendDailyReportReminder(input, mockNotificationServiceAdapter);

    // Assert
    expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenCalled();
    expect(mockNotificationPayloads.length).toBeGreaterThan(0);

    const sentPayload = mockNotificationPayloads[0];
    const expectedRemainingMinutes = 90;
    expect(sentPayload.remainingMinutes).toBe(expectedRemainingMinutes);
  });
});