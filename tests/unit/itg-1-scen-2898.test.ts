import { sendDailyReportReminder, type SendDailyReportReminderInput, type SendDailyReportReminderOutput, type ReminderNotificationDetail } from '../../src/logic/submission-status-tracking';

describe('sendDailyReportReminder - NotificationServiceAdapter失敗時の内部キューと再試行', () => {
  // SCEN-2898
  test('NotificationServiceAdapterが通知送信に失敗したとき、内部キューに保存され段階的に再試行される', async () => {
    // Arrange
    const now = new Date('2026-03-10T09:00:00Z');
    const reportDeadlineTime = new Date('2026-03-10T09:30:00Z');
    
    const failedDeliveries: ReminderNotificationDetail[] = [];
    const retrySchedules: { userId: string; retryCount: number; nextRetryAt: Date }[] = [];

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn(async (userId: string) => {
        // 初回および全再試行で失敗を返す
        failedDeliveries.push({
          userId,
          status: 'failed' as const,
          sentAt: null,
          errorMessage: 'DELIVERY_FAILED',
        });
        return { success: false, error: 'DELIVERY_FAILED' };
      }),
      scheduleNotification: jest.fn(async (userId: string, scheduleTime: Date) => {
        // 再試行スケジュール登録
        const existingSchedule = retrySchedules.find(r => r.userId === userId);
        if (existingSchedule) {
          existingSchedule.retryCount += 1;
          existingSchedule.nextRetryAt = scheduleTime;
        } else {
          retrySchedules.push({
            userId,
            retryCount: 1,
            nextRetryAt: scheduleTime,
          });
        }
        return { scheduled: true };
      }),
      getDeliveryStatus: jest.fn(async (userId: string) => {
        return { status: 'failed', attempts: failedDeliveries.filter(d => d.userId === userId).length };
      }),
    };

    const input: SendDailyReportReminderInput = {
      scheduledTime: now,
      teamIds: ['team-001'],
      reportDeadlineTime,
      notificationChannels: ['email', 'in_app', 'slack'],
    };

    // Act
    const result = await sendDailyReportReminder(input, mockNotificationServiceAdapter as any);

    // Assert - (1) 失敗通知が記録される
    expect(result.failedCount).toBeGreaterThan(0);
    expect(failedDeliveries.length).toBeGreaterThan(0);

    // Assert - (2) 失敗通知に詳細情報が含まれている
    const failedNotification = result.notificationDetails.find(d => d.status === 'failed');
    expect(failedNotification).toBeDefined();
    expect(failedNotification?.errorMessage).toBe('DELIVERY_FAILED');

    // Assert - (3) 再試行スケジュールが登録されている
    expect(retrySchedules.length).toBeGreaterThan(0);
    const schedule = retrySchedules[0];
    expect(schedule.retryCount).toBe(1);

    // Assert - (4) 初回再試行は5分後にスケジュールされている
    const expectedFirstRetry = new Date(now.getTime() + 5 * 60 * 1000);
    expect(schedule.nextRetryAt.getTime()).toBe(expectedFirstRetry.getTime());

    // Assert - (5) 通知配信ログに失敗が記録されている
    expect(result.notificationDetails.some(d => d.status === 'failed')).toBe(true);

    // Act - (6) 第1回目再試行をシミュレート
    const firstRetryTime = new Date(now.getTime() + 5 * 60 * 1000 + 1000); // 5分1秒後
    const secondRetryInput: SendDailyReportReminderInput = {
      scheduledTime: firstRetryTime,
      teamIds: ['team-001'],
      reportDeadlineTime,
      notificationChannels: ['email', 'in_app', 'slack'],
    };

    // スタブは引き続き失敗を返す
    await sendDailyReportReminder(secondRetryInput, mockNotificationServiceAdapter as any);

    // Assert - (7) 第1回目再試行が実行されたことを確認
    expect(retrySchedules[0].retryCount).toBe(2);

    // Assert - (8) 第2回目再試行は15分後にスケジュールされている
    const expectedSecondRetry = new Date(firstRetryTime.getTime() + 15 * 60 * 1000);
    expect(retrySchedules[0].nextRetryAt.getTime()).toBe(expectedSecondRetry.getTime());

    // Act - (9) 第2回目再試行をシミュレート
    const secondRetryTime = new Date(firstRetryTime.getTime() + 15 * 60 * 1000 + 1000);
    const thirdRetryInput: SendDailyReportReminderInput = {
      scheduledTime: secondRetryTime,
      teamIds: ['team-001'],
      reportDeadlineTime,
      notificationChannels: ['email', 'in_app', 'slack'],
    };

    await sendDailyReportReminder(thirdRetryInput, mockNotificationServiceAdapter as any);

    // Assert - (10) 第2回目再試行が実行されたことを確認
    expect(retrySchedules[0].retryCount).toBe(3);

    // Assert - (11) 第3回目再試行は1時間後にスケジュールされている
    const expectedThirdRetry = new Date(secondRetryTime.getTime() + 60 * 60 * 1000);
    expect(retrySchedules[0].nextRetryAt.getTime()).toBe(expectedThirdRetry.getTime());

    // Assert - (12) 再試行スケジュール情報に次回再試行予定時刻が記録されている
    expect(retrySchedules[0].nextRetryAt).toEqual(expectedThirdRetry);

    // Assert - (13) 最終的に3回の再試行がスケジュールされている
    expect(retrySchedules[0].retryCount).toBe(3);

    // Assert - (14) 失敗通知は内部キューに保持されている
    expect(result.notificationDetails.filter(d => d.status === 'failed').length).toBeGreaterThan(0);
  });
});