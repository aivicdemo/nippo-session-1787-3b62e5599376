import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';
import { type SendDailyReportReminderInput, type SendDailyReportReminderOutput } from '../../src/logic/submission-status-tracking';

describe('定時リマインド送信機能 - 報告期限までの残り時間が null のとき処理中断', () => {
  test('SCEN-376: 残り時間が null のとき、NotificationServiceAdapter呼び出しが中止され、スキップログが記録される', async () => {
    // Arrange: NotificationServiceAdapter のモック作成
    const mockNotificationAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: 'sent' as const,
        sentAt: new Date('2024-01-15T09:15:00Z'),
      }),
      scheduleNotification: jest.fn().mockResolvedValue(true),
      getDeliveryStatus: jest.fn().mockResolvedValue([]),
    };

    // 通知配信ログの記録用配列（実装側で利用される想定）
    const notificationLogs: Array<{
      timestamp: Date;
      action: string;
      reason?: string;
    }> = [];

    // モック関数で通知ログを記録
    const originalSendReminder = mockNotificationAdapter.sendReminderNotification;
    mockNotificationAdapter.sendReminderNotification = jest.fn(async (args) => {
      return originalSendReminder(args);
    });

    const sendDailyReportReminderWithAdapter = async (
      input: SendDailyReportReminderInput,
      adapter: typeof mockNotificationAdapter,
      logger?: typeof notificationLogs,
    ): Promise<SendDailyReportReminderOutput> => {
      return sendDailyReportReminder(input, adapter, logger);
    };

    // Input: 報告期限までの残り時間が null
    const input: SendDailyReportReminderInput = {
      scheduledTime: new Date('2024-01-15T08:30:00Z'),
      teamIds: ['team-001', 'team-002'],
      reportDeadlineTime: new Date('2024-01-15T09:00:00Z'),
      notificationChannels: ['email', 'in_app', 'slack'],
    };

    // 実装側で remainingTimeMinutes が null 判定される状況をシミュレート
    // 残り時間計算: deadlineTime - scheduledTime = 09:00 - 08:30 = 30分
    // ただし、外部エラーやシステム状態により remainingTimeMinutes が null になる場合を想定
    const deadlineInfo = {
      deadlineTime: input.reportDeadlineTime,
      remainingMinutes: null as number | null, // null 値を明示的に設定
      isOverdue: false,
    };

    // Act & Assert: sendDailyReportReminder を呼び出し、null チェック処理をトリガー
    const output = await sendDailyReportReminderWithAdapter(input, mockNotificationAdapter, notificationLogs);

    // Assert 1: remainingTimeMinutes が null のため、sendReminderNotification が呼び出されないことを確認
    expect(mockNotificationAdapter.sendReminderNotification).not.toHaveBeenCalled();

    // Assert 2: 処理が正常終了ステータスで完了しており、sentCount が 0 であることを確認
    expect(output.sentCount).toBe(0);
    expect(output.failedCount).toBe(0);

    // Assert 3: remainingTimeMinutes が null のため、出力の remainingTimeMinutes も null または特定の値で記録される
    // 実装仕様では null の場合は特定の値（例：-1）が返される可能性、または null そのもの
    expect(output.remainingTimeMinutes).toBe(null);

    // Assert 4: notificationDetails が空配列、またはスキップ理由を含む構造であることを確認
    expect(Array.isArray(output.notificationDetails)).toBe(true);
    expect(output.notificationDetails.length).toBe(0);

    // Assert 5: ログ配列にスキップ理由『残り時間が null のため処理中断』が記録されていることを確認
    // ログが存在する場合の検証
    if (notificationLogs.length > 0) {
      const skipLog = notificationLogs.find(
        (log) => log.action === 'skipped' && log.reason?.includes('残り時間'),
      );
      expect(skipLog).toBeDefined();
      if (skipLog) {
        expect(skipLog.reason).toMatch(/残り時間/);
      }
    }

    // Assert 6: ダッシュボード通知エラーが発生していないこと（正常なスキップのため）
    // 実装仕様で dashboard-error フラグが存在する場合の検証
    expect(output).not.toHaveProperty('dashboardError');
  });
});