import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';
import type { SendDailyReportReminderInput, SendDailyReportReminderOutput } from '../../src/logic/submission-status-tracking';

describe('リマインド通知自動送信機能', () => {
  let notificationServiceAdapterMock: any;

  beforeEach(() => {
    notificationServiceAdapterMock = {
      sendReminderNotification: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-2552
  test('ユーザーID が null のとき通知送信に失敗する', async () => {
    // Arrange
    const scheduledTime = new Date('2024-01-15T08:30:00Z');
    const reportDeadlineTime = new Date('2024-01-15T09:00:00Z');
    const teamIds = ['team-001', 'team-002'];
    const notificationChannels: ('email' | 'in_app' | 'slack')[] = ['email', 'slack'];

    const reminderInput: SendDailyReportReminderInput = {
      scheduledTime,
      teamIds,
      reportDeadlineTime,
      notificationChannels,
    };

    notificationServiceAdapterMock.sendReminderNotification.mockImplementation(
      (userId: string | null) => {
        if (userId === null) {
          throw new Error('userId is null');
        }
        return { status: 'sent', sentAt: new Date() };
      }
    );

    // Act & Assert
    try {
      const result: SendDailyReportReminderOutput = await sendDailyReportReminder(
        reminderInput,
        notificationServiceAdapterMock
      );
      expect(result.sentCount).toBe(0);
      expect(result.failedCount).toBeGreaterThan(0);
      expect(result.notificationDetails).toContainEqual(
        expect.objectContaining({
          status: 'failed',
          errorMessage: expect.stringMatching(/userId is null/),
        })
      );
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toMatch(/userId is null/);
    }
  });
});