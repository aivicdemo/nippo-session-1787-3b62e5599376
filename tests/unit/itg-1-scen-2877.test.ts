import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { detectAndNotifyUnsubmittedMembers } from '../../src/logic/submission-status-tracking';

describe('毎朝の定時にチームメンバーへ報告入力のリマインド通知を自動送信し、報告期限までの時間を表示する機能', () => {
  let mockNotificationService: any;
  let notificationLogs: any[];
  let currentSystemTime: Date;

  beforeEach(() => {
    notificationLogs = [];
    currentSystemTime = new Date('2026-08-20T08:55:00Z');

    mockNotificationService = {
      sendReminderNotification: jest.fn(async (userId: string, reminderType: string, remainingMinutes: number) => {
        const logEntry = {
          userId,
          reminderType,
          remainingMinutes,
          sentAt: new Date(currentSystemTime),
          status: 'SUCCESS',
        };
        notificationLogs.push(logEntry);
        return {
          status: 'sent',
          sentAt: new Date(currentSystemTime),
          userId,
        };
      }),
      getDeliveryStatus: jest.fn(async (notificationId: string) => {
        return { status: 'delivered', timestamp: new Date(currentSystemTime) };
      }),
    };

    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  // SCEN-2877
  test('未提出メンバー催促通知の段階的送信ロジック - 報告期限までの残り時間がちょうど0分（期限満了時刻）の場合、最終催促通知が送信される', async () => {
    const teamId = 'team-001';
    const reportDate = '2026-08-20';
    const executorUserId = 'admin-001';
    const reportDeadlineTime = new Date('2026-08-20T09:00:00Z');
    const unsubmittedMemberId = 'user-001';

    // Initialize unsubmitted members database mock
    const unsubmittedMembers = [
      {
        userId: unsubmittedMemberId,
        userName: 'Engineer A',
        email: 'engineer-a@example.com',
        remainingMinutes: 5,
      },
    ];

    // Simulate initial notification logs (already sent at earlier times)
    notificationLogs.push({
      userId: unsubmittedMemberId,
      reminderType: 'FIRST_REMINDER',
      remainingMinutes: 30,
      sentAt: new Date('2026-08-20T08:30:00Z'),
      status: 'SUCCESS',
    });

    notificationLogs.push({
      userId: unsubmittedMemberId,
      reminderType: 'INTERMEDIATE_REMINDER',
      remainingMinutes: 5,
      sentAt: new Date('2026-08-20T08:55:00Z'),
      status: 'SUCCESS',
    });

    const initialLogCount = notificationLogs.length;

    // Advance system time to deadline (remaining minutes = 0)
    currentSystemTime = new Date('2026-08-20T09:00:00Z');
    jest.setSystemTime(currentSystemTime);

    // Call the function at deadline time
    const result = await detectAndNotifyUnsubmittedMembers(
      {
        teamId,
        reportDate,
        morningMeetingStartTime: '09:00',
        executorUserId,
      },
      {
        getUnsubmittedMembers: jest.fn(async () => unsubmittedMembers),
        sendNotification: mockNotificationService.sendReminderNotification,
        recordNotificationLog: jest.fn(async (log: any) => {
          notificationLogs.push(log);
        }),
        queryNotificationLogs: jest.fn(async (filter: any) => {
          return notificationLogs.filter((log) => {
            if (filter.userId && log.userId !== filter.userId) return false;
            if (filter.reminderType && log.reminderType !== filter.reminderType) return false;
            if (filter.sentAtTime) {
              const logTime = new Date(log.sentAt).getTime();
              const filterTime = new Date(filter.sentAtTime).getTime();
              if (logTime !== filterTime) return false;
            }
            return true;
          });
        }),
      }
    );

    // Verify FINAL_REMINDER was sent
    expect(mockNotificationService.sendReminderNotification).toHaveBeenCalled();
    const callArguments = mockNotificationService.sendReminderNotification.mock.calls;
    const finalReminderCall = callArguments.find((args: any[]) => args[1] === 'FINAL_REMINDER');
    expect(finalReminderCall).toBeDefined();
    expect(finalReminderCall[0]).toBe(unsubmittedMemberId);
    expect(finalReminderCall[2]).toBe(0); // remainingMinutes = 0 at deadline

    // Verify notification log contains exactly one FINAL_REMINDER entry for the user at deadline time
    const finalReminderLogs = notificationLogs.filter(
      (log) =>
        log.userId === unsubmittedMemberId &&
        log.reminderType === 'FINAL_REMINDER' &&
        log.sentAt.getTime() === new Date('2026-08-20T09:00:00Z').getTime()
    );

    expect(finalReminderLogs).toHaveLength(1);
    expect(finalReminderLogs[0].status).toBe('SUCCESS');
    expect(finalReminderLogs[0].remainingMinutes).toBe(0);

    // Verify no duplicate notifications for this stage
    const totalFinalReminders = notificationLogs.filter(
      (log) =>
        log.userId === unsubmittedMemberId &&
        log.reminderType === 'FINAL_REMINDER'
    );
    expect(totalFinalReminders).toHaveLength(1);

    // Verify earlier reminders are still in logs but FINAL_REMINDER is new
    expect(notificationLogs.length).toBeGreaterThan(initialLogCount);
    expect(result.notificationsSent).toBeGreaterThanOrEqual(1);
  });
});