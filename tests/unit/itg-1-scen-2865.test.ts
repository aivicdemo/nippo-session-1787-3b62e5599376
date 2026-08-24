import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { detectAndNotifyUnsubmittedMembers } from '../../src/logic/submission-status-tracking';

describe('未提出メンバー催促通知機能 - タイムスタンプ欠落エラーハンドリング', () => {
  // SCEN-2865
  test('タイムスタンプが欠落している催促通知レコードに対して、再催促タイミング判定が失敗し、適切なエラー処理が実行される', async () => {
    // Arrange: スタブ化されたNotificationServiceAdapter
    const notificationServiceAdapterStub = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        userId: 'member_001',
        status: 'sent',
        sentAt: new Date('2026-08-20T09:30:00Z'),
        errorMessage: null,
      }),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    // ロギングをキャプチャするためのモック
    const errorLogs: string[] = [];
    const adminAlerts: string[] = [];
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;

    console.error = jest.fn((message: string) => {
      errorLogs.push(message);
    });

    console.warn = jest.fn((message: string) => {
      adminAlerts.push(message);
    });

    try {
      // システム時刻を固定値に設定
      const fixedCurrentTime = new Date('2026-08-20T09:30:00Z');
      jest.useFakeTimers();
      jest.setSystemTime(fixedCurrentTime);

      // 未提出メンバーのデータ構造
      const unsubmittedMembersInput = {
        teamId: 'team_001',
        reportDate: '2026-08-20',
        morningMeetingStartTime: '09:00',
        executorUserId: 'executor_001',
      };

      // タイムスタンプが欠落している催促通知ログレコード
      const malformedNotificationLog = {
        userId: 'member_001',
        userName: 'John Doe',
        email: 'john@example.com',
        notificationId: 'notif_001',
        sentAt: null, // タイムスタンプ欠落
        channel: 'email' as const,
        status: 'sent' as const,
        attemptNumber: 1,
      };

      // Act: detectAndNotifyUnsubmittedMembers関数を呼び出し
      // 欠落したタイムスタンプを含むログが前提条件として存在する状態をシミュレート
      const result = await detectAndNotifyUnsubmittedMembers(
        unsubmittedMembersInput,
        notificationServiceAdapterStub,
        // 追加の依存注入: 不正なログレコードを含むデータソース
        {
          existingNotificationLogs: [malformedNotificationLog],
          currentTime: fixedCurrentTime,
        }
      );

      // Assert
      // (1) エラーログに適切なメッセージが記録されることを確認
      expect(errorLogs.some((log) =>
        log.includes('Cannot calculate elapsed time') &&
        log.includes('Missing timestamp') &&
        log.includes('member_001')
      )).toBe(true);

      // (2) メンバーAへの再催促通知が送信されないことを確認
      // NotificationServiceAdapterの呼び出し回数が0であること、または
      // member_001に対する呼び出しがないことを検証
      const reminderCallsForMember001 = (
        notificationServiceAdapterStub.sendReminderNotification as jest.Mock
      ).mock.calls.filter((call: any[]) => call[0]?.userId === 'member_001');
      expect(reminderCallsForMember001.length).toBe(0);

      // (3) 管理者への内部アラートが生成されることを確認
      expect(adminAlerts.some((alert) =>
        alert.includes('催促タイミング判定失敗') &&
        alert.includes('member_001') &&
        alert.includes('タイムスタンプ欠落')
      )).toBe(true);

      // (4) 当該メンバーの催促ステータスが『判定失敗』のまま維持されることを確認
      expect(result.notificationFailures).toContainEqual(
        expect.objectContaining({
          userId: 'member_001',
          failureReason: expect.stringMatching(/タイムスタンプ|timestamp/i),
        })
      );

      // 戻り値の構造を検証
      expect(result).toHaveProperty('unsubmittedMembers');
      expect(result).toHaveProperty('notificationsSent');
      expect(result).toHaveProperty('notificationFailures');
      expect(result).toHaveProperty('executedAt');

      // notificationsSentが0であることを確認（失敗したため送信されていない）
      expect(result.notificationsSent).toBe(0);

      // notificationFailuresに該当メンバーが含まれていることを確認
      expect(result.notificationFailures.length).toBeGreaterThan(0);
      expect(
        result.notificationFailures.some((failure: any) => failure.userId === 'member_001')
      ).toBe(true);

    } finally {
      // Cleanup
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
      jest.useRealTimers();
    }
  });
});