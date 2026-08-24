import { detectAndNotifyUnsubmittedMembers } from '../../src/logic/submission-status-tracking';

describe('未提出メンバー催促通知機能', () => {
  // SCEN-2847
  test('部長が手動で未提出確認画面を開いたとき、催促通知が送信される', async () => {
    // ===== テストデータセットアップ =====
    // 未提出メンバー（3名）の定義
    const unsubmittedMembers = [
      {
        userId: 'user-001',
        userName: '田中太郎',
        email: 'tanaka@example.com',
        remainingMinutes: -15,
      },
      {
        userId: 'user-002',
        userName: '鈴木花子',
        email: 'suzuki@example.com',
        remainingMinutes: -30,
      },
      {
        userId: 'user-003',
        userName: '佐藤次郎',
        email: 'sato@example.com',
        remainingMinutes: -45,
      },
    ];

    const teamId = 'team-001';
    const reportDate = '2024-01-15';
    const requestUserId = 'manager-001'; // 部長ユーザーID
    const requestUserName = '部長';
    const requestUserEmail = 'manager@example.com';

    // ===== NotificationServiceAdapterのスタブ化 =====
    let sendReminderNotificationCalls: Array<{
      userIds: string[];
      message: string;
    }> = [];

    const notificationServiceAdapterStub = {
      sendReminderNotification: jest.fn(
        async (userIds: string[], message: string) => {
          sendReminderNotificationCalls.push({ userIds, message });
          return {
            sentCount: userIds.length,
            failedCount: 0,
            notificationDetails: userIds.map((userId) => ({
              userId,
              status: 'sent' as const,
              sentAt: new Date('2024-01-15T10:00:00Z'),
              errorMessage: null,
            })),
          };
        }
      ),
    };

    // ===== 通知配信ログを記録するスタブ =====
    let notificationLogs: Array<{
      timestamp: string;
      senderId: string;
      senderName: string;
      senderEmail: string;
      recipientUserIds: string[];
      status: string;
    }> = [];

    const logNotificationStub = jest.fn(
      (
        timestamp: string,
        senderId: string,
        senderName: string,
        senderEmail: string,
        recipientUserIds: string[],
        status: string
      ) => {
        notificationLogs.push({
          timestamp,
          senderId,
          senderName,
          senderEmail,
          recipientUserIds,
          status,
        });
        return Promise.resolve();
      }
    );

    // ===== 関数呼び出し =====
    const result = await detectAndNotifyUnsubmittedMembers(
      {
        teamId,
        reportDate,
        unsubmittedMembers,
        requestUserId,
        requestUserName,
        requestUserEmail,
      },
      notificationServiceAdapterStub,
      logNotificationStub
    );

    // ===== 検証: NotificationServiceAdapterの呼び出し確認 =====
    // 1. sendReminderNotificationが1回呼び出されたことを確認
    expect(notificationServiceAdapterStub.sendReminderNotification).toHaveBeenCalledTimes(1);

    // 2. 呼び出し時に未提出メンバーのユーザーID配列が渡されたことを確認
    const expectedUserIds = ['user-001', 'user-002', 'user-003'];
    expect(sendReminderNotificationCalls[0].userIds).toEqual(expectedUserIds);

    // 3. メッセージ内容が適切に生成されていることを確認
    expect(sendReminderNotificationCalls[0].message).toContain('team-001');
    expect(sendReminderNotificationCalls[0].message).toContain('2024-01-15');

    // ===== 検証: 戻り値の確認 =====
    // 配信ステータス『成功』が返却されたことを確認
    expect(result.sentCount).toBe(3);
    expect(result.failedCount).toBe(0);
    expect(result.notificationDetails).toHaveLength(3);
    expect(result.notificationDetails[0].status).toBe('sent');
    expect(result.notificationDetails[1].status).toBe('sent');
    expect(result.notificationDetails[2].status).toBe('sent');

    // ===== 検証: 通知配信ログテーブルへの記録 =====
    // 1. ログが1件記録されたことを確認
    expect(notificationLogs).toHaveLength(1);

    // 2. ログの内容を確認
    const log = notificationLogs[0];
    expect(log.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    expect(log.senderId).toBe('manager-001');
    expect(log.senderName).toBe('部長');
    expect(log.senderEmail).toBe('manager@example.com');
    expect(log.recipientUserIds).toEqual(['user-001', 'user-002', 'user-003']);
    expect(log.status).toBe('success');

    // ===== 検証: logNotificationStubが1回呼び出されたことを確認 =====
    expect(logNotificationStub).toHaveBeenCalledTimes(1);
  });
});