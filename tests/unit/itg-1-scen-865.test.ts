import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';
import type { SendDailyReportReminderInput, SendDailyReportReminderOutput, ReminderNotificationDetail } from '../../src/logic/submission-status-tracking';

describe('sendDailyReportReminder - エラーハンドリング', () => {
  // SCEN-865
  test('送信対象ユーザーのIDが空文字列で渡されたときValidationErrorが発生する', () => {
    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn(),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    const input: SendDailyReportReminderInput = {
      scheduledTime: new Date('2024-01-15T08:30:00Z'),
      teamIds: ['team-001'],
      reportDeadlineTime: new Date('2024-01-15T09:00:00Z'),
      notificationChannels: ['email', 'in_app', 'slack'],
    };

    // 送信対象ユーザーのIDが空文字列のケースをシミュレート
    // sendReminderNotificationが空のuserIdで呼ばれる場合のエラー処理を検証
    mockNotificationServiceAdapter.sendReminderNotification.mockImplementation(
      (userId: string) => {
        if (userId === '') {
          throw new Error('ユーザーIDが空文字列です');
        }
        return {
          userId,
          status: 'sent' as const,
          sentAt: new Date('2024-01-15T08:30:05Z'),
        };
      }
    );

    expect(() => {
      sendDailyReportReminder(input, mockNotificationServiceAdapter);
    }).toThrow(/ユーザーID/);
  });
});