import { sendDailyReminderNotifications } from '../../src/logic/reminder-notification-service';
import { type DailyReminderInput } from '../../src/logic/reminder-notification-service';

jest.mock('../../src/logic/reminder-notification-service', () => {
  const actualModule = jest.requireActual('../../src/logic/reminder-notification-service');
  return {
    ...actualModule,
    buildNotificationRecipientList: jest.fn(),
    formatReminderNotificationContent: jest.fn(),
    recordNotificationSendingHistory: jest.fn(),
  };
});

describe('朝会報告管理システム - 定時リマインド通知送信', () => {
  test('SCEN-288: 毎朝定時に登録済みチームメンバー全員へ報告入力のリマインド通知を自動送信し、報告期限までの残り時間を表示する', () => {
    const { buildNotificationRecipientList, formatReminderNotificationContent, recordNotificationSendingHistory } = require('../../src/logic/reminder-notification-service');

    const mockMemberIds = ['member001', 'member002', 'member003', 'member004', 'member005', 'member006', 'member007', 'member008', 'member009', 'member010'];
    const mockHistoryIds = ['hist-001', 'hist-002', 'hist-003', 'hist-004', 'hist-005', 'hist-006', 'hist-007', 'hist-008', 'hist-009', 'hist-010'];

    buildNotificationRecipientList.mockReturnValue({
      recipients: mockMemberIds.map(id => ({
        userId: id,
        emailAddress: `${id}@company.example.com`,
        displayName: `Member ${id}`,
        role: 'engineer',
      })),
      totalCount: 10,
      excludedUserCount: 0,
    });

    formatReminderNotificationContent.mockImplementation((input) => ({
      subject: '朝会報告入力のお願い',
      body: `残り${Math.floor((new Date(input.reportDeadlineAt).getTime() - new Date(input.currentTimeAt).getTime()) / 60000)}分です。入力をお願いします。`,
      remainingHours: Math.floor((new Date(input.reportDeadlineAt).getTime() - new Date(input.currentTimeAt).getTime()) / 3600000),
      remainingMinutes: Math.floor(((new Date(input.reportDeadlineAt).getTime() - new Date(input.currentTimeAt).getTime()) % 3600000) / 60000),
    }));

    recordNotificationSendingHistory.mockReturnValue(mockHistoryIds);

    const currentTime = new Date('2025-01-15T08:30:00Z');
    const reportDeadline = new Date('2025-01-15T09:00:00Z');
    const scheduledTime = new Date('2025-01-15T08:30:00Z');

    const input: DailyReminderInput = {
      teamId: 'team-alpha',
      reportDeadlineDateTime: reportDeadline,
      executionTimestamp: scheduledTime,
      notificationChannels: [
        { channelType: 'email', isEnabled: true },
        { channelType: 'in_app_notification', isEnabled: true },
      ],
    };

    const result = sendDailyReminderNotifications(input);

    expect(result.successCount).toBe(10);
    expect(result.failureCount).toBe(0);
    expect(result.notificationHistoryIds).toHaveLength(10);
    expect(result.notificationHistoryIds).toEqual(mockHistoryIds);
    expect(result.remainingTimeDisplay).toBe('残り30分');
  });
});