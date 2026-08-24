import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';

describe('朝会報告リマインド通知スケジュール登録', () => {
  // SCEN-159
  test('定時スケジュール登録時刻が朝9時直後（9時1分）であるとき、翌日の同時刻に予約される', () => {
    const mockScheduledTime = new Date('2026-09-15T09:01:00+09:00');
    const expectedNextDayScheduleTime = new Date('2026-09-16T09:00:00+09:00');
    
    const teamIds = ['team-001'];
    const reportDeadlineTime = new Date('2026-09-15T09:30:00+09:00');
    const notificationChannels = ['email', 'in_app', 'slack'] as const;
    
    const scheduledNotifications: Array<{
      scheduleTime: Date;
      teamIds: string[];
      notificationChannels: (typeof notificationChannels)[number][];
    }> = [];
    
    const notificationServiceAdapterStub = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        userId: 'user-001',
        status: 'sent' as const,
        sentAt: new Date('2026-09-15T09:01:00+09:00'),
        errorMessage: null
      }),
      scheduleNotification: jest.fn((scheduleTime: Date, tids: string[], channels: (typeof notificationChannels)[number][]) => {
        scheduledNotifications.push({
          scheduleTime,
          teamIds: tids,
          notificationChannels: channels
        });
        return Promise.resolve({
          scheduledAt: new Date('2026-09-15T09:01:00+09:00'),
          nextExecutionTime: scheduleTime
        });
      }),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        sent: 0,
        failed: 0,
        pending: 0
      })
    };
    
    const input = {
      scheduledTime: mockScheduledTime,
      teamIds,
      reportDeadlineTime,
      notificationChannels
    };
    
    return sendDailyReportReminder(input, notificationServiceAdapterStub)
      .then((output) => {
        expect(notificationServiceAdapterStub.scheduleNotification).toHaveBeenCalled();
        
        expect(scheduledNotifications).toHaveLength(1);
        const [firstScheduledNotification] = scheduledNotifications;
        
        expect(firstScheduledNotification.scheduleTime.toISOString()).toBe(
          expectedNextDayScheduleTime.toISOString()
        );
        
        expect(firstScheduledNotification.teamIds).toEqual(teamIds);
        expect(firstScheduledNotification.notificationChannels).toEqual(notificationChannels);
        
        expect(output).toBeDefined();
        expect(output.sentCount).toBeGreaterThanOrEqual(0);
        expect(output.failedCount).toBeGreaterThanOrEqual(0);
      });
  });
});