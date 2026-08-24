import { detectAndNotifyUnsubmittedMembers } from '../../src/logic/submission-status-tracking';

describe('未提出メンバー催促通知機能', () => {
  // SCEN-2856: [error] 未提出メンバー催促通知機能 - 報告期限時刻がnullのとき、催促判定が実行されない
  test('報告期限時刻がnullの場合、催促通知が送信されず催促判定がスキップされる', async () => {
    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: 'sent',
        sentAt: new Date('2026-08-20T09:00:00Z'),
      }),
    };

    const mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    const testInput = {
      teamId: 'TEAM-001',
      reportDate: '2026-08-20',
      morningMeetingStartTime: '09:00',
      executorUserId: 'USER-MANAGER-001',
      deadlineConfig: {
        reportDate: new Date('2026-08-20'),
        deadlineTime: null as unknown as string,
        timeZone: 'Asia/Tokyo',
      },
      unsubmittedMembers: [
        {
          userId: 'USER-ENG-001',
          userName: '太郎',
          email: 'taro@example.com',
          remainingMinutes: 45,
        },
        {
          userId: 'USER-ENG-002',
          userName: '花子',
          email: 'hanako@example.com',
          remainingMinutes: 45,
        },
      ],
    };

    const result = await detectAndNotifyUnsubmittedMembers(
      testInput,
      mockNotificationServiceAdapter,
      mockLogger
    );

    expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenCalledTimes(0);
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('Deadline time is null')
    );
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('TEAM-001')
    );
    expect(result.notificationsSent).toBe(0);
    expect(result.notificationFailures).toEqual([]);
  });
});