import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';
import { type SendDailyReportReminderInput, type SendDailyReportReminderOutput, type ReminderNotificationDetail } from '../../src/logic/submission-status-tracking';

describe('朝会開始予定時刻の30分前リマインド通知送信', () => {
  test('SCEN-2907: 朝会開始予定時刻の30分前ちょうどでリマインド通知送信が発火する', async () => {
    // テストユーザー10名の情報
    const testUserIds = Array.from({ length: 10 }, (_, i) => `user_${String(i + 1).padStart(2, '0')}`);
    
    // 固定日時: 朝会開始予定時刻の30分前ちょうど
    const morningMeetingStartTime = new Date('2026-08-20T09:00:00Z');
    const scheduledTime = new Date('2026-08-20T08:30:00Z');
    const reportDeadlineTime = new Date('2026-08-20T09:00:00Z');
    
    // NotificationServiceAdapterのモック
    const notificationServiceAdapter = {
      sentNotifications: [] as Array<{
        userId: string;
        message: string;
        sentAt: Date;
      }>,
      
      sendReminderNotification: jest.fn(async (userId: string, message: string, channels: string[]): Promise<{ success: boolean; sentAt: Date }> => {
        const sentAt = new Date('2026-08-20T08:30:00Z');
        notificationServiceAdapter.sentNotifications.push({
          userId,
          message,
          sentAt,
        });
        return { success: true, sentAt };
      }),
      
      scheduleNotification: jest.fn(async (scheduledTime: Date, callback: () => Promise<void>) => {
        await callback();
      }),
      
      getDeliveryStatus: jest.fn(),
    };

    // 通知配信ログテーブルのモック
    const notificationLogTable: Array<{
      userId: string;
      sentAt: Date;
      channels: string[];
    }> = [];

    // sendDailyReportReminderの入力パラメータ
    const input: SendDailyReportReminderInput = {
      scheduledTime,
      teamIds: ['team_dev'],
      reportDeadlineTime,
      notificationChannels: ['email', 'in_app', 'slack'],
    };

    // テスト実行前にモックをリセット
    jest.clearAllMocks();

    // sendDailyReportReminderを実行
    const output = await sendDailyReportReminder(
      input,
      {
        getTeamMembers: jest.fn(async (teamId: string) => {
          // team_devに対してテストユーザー10名を返す
          return testUserIds.map((userId) => ({
            userId,
            email: `${userId}@example.com`,
          }));
        }),
        
        sendReminderNotification: notificationServiceAdapter.sendReminderNotification,
        
        scheduleNotification: notificationServiceAdapter.scheduleNotification,
        
        logNotificationSent: jest.fn(async (record: {
          userId: string;
          sentAt: Date;
          channels: string[];
        }) => {
          notificationLogTable.push(record);
        }),
      }
    );

    // 検証1: sendReminderNotificationが登録されたテストユーザー全10名に対して正確に1回ずつ呼び出されたことを確認
    expect(notificationServiceAdapter.sendReminderNotification).toHaveBeenCalledTimes(10);

    // 検証2: 各呼び出しの確認（全員に対して呼び出されたことを確認）
    testUserIds.forEach((userId) => {
      expect(notificationServiceAdapter.sendReminderNotification).toHaveBeenCalledWith(
        userId,
        expect.stringContaining('朝会開始まで30分です'),
        ['email', 'in_app', 'slack']
      );
    });

    // 検証3: 通知配信ログテーブルに10件のレコードが「2026-08-20 08:30:00」のタイムスタンプで記録されていることを確認
    expect(notificationLogTable).toHaveLength(10);
    notificationLogTable.forEach((record) => {
      expect(record.sentAt).toEqual(new Date('2026-08-20T08:30:00Z'));
      expect(testUserIds).toContain(record.userId);
    });

    // 検証4: 出力の検証
    expect(output.sentCount).toBe(10);
    expect(output.failedCount).toBe(0);
    expect(output.remainingTimeMinutes).toBe(30);
    expect(output.notificationDetails).toHaveLength(10);
    
    // 検証5: 各notificationDetailが正しいステータスを持つことを確認
    output.notificationDetails.forEach((detail: ReminderNotificationDetail) => {
      expect(detail.status).toBe('sent');
      expect(detail.sentAt).toEqual(new Date('2026-08-20T08:30:00Z'));
      expect(detail.errorMessage).toBeUndefined();
      expect(testUserIds).toContain(detail.userId);
    });

    // 検証6: sentNotificationsに記録された通知の内容を確認
    expect(notificationServiceAdapter.sentNotifications).toHaveLength(10);
    notificationServiceAdapter.sentNotifications.forEach((notification) => {
      expect(notification.message).toMatch(/朝会開始まで30分です/);
      expect(notification.sentAt).toEqual(new Date('2026-08-20T08:30:00Z'));
    });
  });
});