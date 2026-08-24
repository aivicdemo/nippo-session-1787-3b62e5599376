import { detectAndNotifyUnsubmittedMembers } from '../../src/logic/submission-status-tracking';
import type { DetectUnsubmittedMembersInput, DetectUnsubmittedMembersOutput, NotificationFailure } from '../../src/logic/submission-status-tracking';

describe('未提出メンバー催促通知の段階的送信ロジック', () => {
  // SCEN-2874
  test('同一メンバーが複数回の再催促対象に含まれる場合、最新の通知方法に更新される', async () => {
    const memberAUserId = 'memberA';
    const memberAEmail = 'memberA@example.com';
    const memberAName = 'Member A';
    const teamId = 'team-001';
    const reportDate = '2024-01-15';
    const morningMeetingStartTime = '09:00';
    const executorUserId = 'executor-001';

    const sendReminderNotificationCallHistory: Array<{
      userId: string;
      channel: 'email' | 'in_app' | 'slack';
      remainingMinutes: number;
    }> = [];

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn(async (userId: string, channel: 'email' | 'in_app' | 'slack', remainingMinutes: number) => {
        sendReminderNotificationCallHistory.push({
          userId,
          channel,
          remainingMinutes,
        });
        return { sentAt: new Date('2024-01-15T08:45:00Z'), success: true };
      }),
    };

    const input: DetectUnsubmittedMembersInput = {
      teamId,
      reportDate,
      morningMeetingStartTime,
      executorUserId,
    };

    const mockGetUnsubmittedMembers = jest.fn(async () => [
      {
        userId: memberAUserId,
        userName: memberAName,
        email: memberAEmail,
        remainingMinutes: 15,
      },
    ]);

    const mockRecordNotificationLog = jest.fn(async (userId: string, channel: string) => {
      return {
        userId,
        notification_method: channel,
        logged_at: new Date('2024-01-15T08:45:00Z'),
      };
    });

    const mockGetLatestNotificationMethod = jest.fn(async (userId: string) => {
      const history = sendReminderNotificationCallHistory.filter(h => h.userId === userId);
      return history.length > 0 ? history[history.length - 1].channel : null;
    });

    const firstReminderOutput: DetectUnsubmittedMembersOutput = await detectAndNotifyUnsubmittedMembers(
      input,
      mockNotificationServiceAdapter as any,
      mockRecordNotificationLog as any,
      mockGetUnsubmittedMembers as any,
    );

    expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenCalledTimes(1);
    expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenCalledWith(
      memberAUserId,
      'slack',
      15,
    );
    expect(firstReminderOutput.unsubmittedMembers).toHaveLength(1);
    expect(firstReminderOutput.unsubmittedMembers[0].userId).toBe(memberAUserId);
    expect(firstReminderOutput.notificationsSent).toBe(1);

    expect(sendReminderNotificationCallHistory).toHaveLength(1);
    expect(sendReminderNotificationCallHistory[0]).toEqual({
      userId: memberAUserId,
      channel: 'slack',
      remainingMinutes: 15,
    });

    const secondReminderOutput: DetectUnsubmittedMembersOutput = await detectAndNotifyUnsubmittedMembers(
      input,
      mockNotificationServiceAdapter as any,
      mockRecordNotificationLog as any,
      mockGetUnsubmittedMembers as any,
    );

    expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenCalledTimes(2);
    expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenLastCalledWith(
      memberAUserId,
      'teams',
      10,
    );

    expect(sendReminderNotificationCallHistory).toHaveLength(2);
    expect(sendReminderNotificationCallHistory[0]).toEqual({
      userId: memberAUserId,
      channel: 'slack',
      remainingMinutes: 15,
    });
    expect(sendReminderNotificationCallHistory[1]).toEqual({
      userId: memberAUserId,
      channel: 'teams',
      remainingMinutes: 10,
    });

    const latestNotificationMethod = await mockGetLatestNotificationMethod(memberAUserId);
    expect(latestNotificationMethod).toBe('teams');

    expect(mockRecordNotificationLog).toHaveBeenCalledTimes(2);
    expect(mockRecordNotificationLog).toHaveBeenNthCalledWith(1, memberAUserId, 'slack');
    expect(mockRecordNotificationLog).toHaveBeenNthCalledWith(2, memberAUserId, 'teams');

    expect(secondReminderOutput.unsubmittedMembers).toHaveLength(1);
    expect(secondReminderOutput.notificationsSent).toBe(1);
  });
});