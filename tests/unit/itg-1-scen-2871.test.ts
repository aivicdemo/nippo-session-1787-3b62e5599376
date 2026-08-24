import { detectAndNotifyUnsubmittedMembers } from '../../src/logic/submission-status-tracking';

describe('未提出メンバー催促通知の段階的送信ロジック', () => {
  test('SCEN-2871: 朝会開始予定時刻の正確に15分前のみ催促通知が送信される', async () => {
    const baselineTime = new Date('2024-01-15T09:00:00Z');
    const fifteenMinutesBefore = new Date(baselineTime.getTime() - 15 * 60 * 1000);
    const fourteenMinutesBefore = new Date(baselineTime.getTime() - 14 * 60 * 1000);
    const sixteenMinutesBefore = new Date(baselineTime.getTime() - 16 * 60 * 1000);

    const teamId = 'team-001';
    const reportDate = '2024-01-15';
    const executorUserId = 'user-admin-001';
    const morningMeetingStartTime = '09:00';

    const unsubmittedMembersList = [
      {
        userId: 'user-eng-001',
        userName: 'Engineer A',
        email: 'eng-a@example.com',
        remainingMinutes: 15,
      },
      {
        userId: 'user-eng-002',
        userName: 'Engineer B',
        email: 'eng-b@example.com',
        remainingMinutes: 15,
      },
    ];

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        userId: '',
        status: 'sent' as const,
        sentAt: new Date(),
        errorMessage: null,
      }),
      scheduleNotification: jest.fn().mockResolvedValue(undefined),
      getDeliveryStatus: jest.fn().mockResolvedValue(null),
    };

    const mockGetCurrentTime = jest.fn();
    const mockGetUnsubmittedMembers = jest.fn().mockResolvedValue(unsubmittedMembersList);
    const mockRecordNotificationHistory = jest.fn().mockResolvedValue(undefined);

    // Case 1: 正確に15分前 - 催促通知が送信される
    mockGetCurrentTime.mockReturnValueOnce(fifteenMinutesBefore);

    const result1 = await detectAndNotifyUnsubmittedMembers(
      {
        teamId,
        reportDate,
        morningMeetingStartTime,
        executorUserId,
      },
      {
        notificationService: mockNotificationServiceAdapter,
        getCurrentTime: mockGetCurrentTime,
        getUnsubmittedMembers: mockGetUnsubmittedMembers,
        recordNotificationHistory: mockRecordNotificationHistory,
      }
    );

    expect(result1.notificationsSent).toBe(2);
    expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenCalledTimes(2);

    // Case 2: 14分前 - 催促通知が送信されない
    mockNotificationServiceAdapter.sendReminderNotification.mockClear();
    mockGetCurrentTime.mockReturnValueOnce(fourteenMinutesBefore);

    const result2 = await detectAndNotifyUnsubmittedMembers(
      {
        teamId,
        reportDate,
        morningMeetingStartTime,
        executorUserId,
      },
      {
        notificationService: mockNotificationServiceAdapter,
        getCurrentTime: mockGetCurrentTime,
        getUnsubmittedMembers: mockGetUnsubmittedMembers,
        recordNotificationHistory: mockRecordNotificationHistory,
      }
    );

    expect(result2.notificationsSent).toBe(0);
    expect(mockNotificationServiceAdapter.sendReminderNotification).not.toHaveBeenCalled();

    // Case 3: 16分前 - 催促通知が送信されない
    mockNotificationServiceAdapter.sendReminderNotification.mockClear();
    mockGetCurrentTime.mockReturnValueOnce(sixteenMinutesBefore);

    const result3 = await detectAndNotifyUnsubmittedMembers(
      {
        teamId,
        reportDate,
        morningMeetingStartTime,
        executorUserId,
      },
      {
        notificationService: mockNotificationServiceAdapter,
        getCurrentTime: mockGetCurrentTime,
        getUnsubmittedMembers: mockGetUnsubmittedMembers,
        recordNotificationHistory: mockRecordNotificationHistory,
      }
    );

    expect(result3.notificationsSent).toBe(0);
    expect(mockNotificationServiceAdapter.sendReminderNotification).not.toHaveBeenCalled();
  });
});