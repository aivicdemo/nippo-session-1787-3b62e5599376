// SCEN-284
import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';
import { type SendDailyReportReminderInput, type SendDailyReportReminderOutput } from '../../src/logic/submission-status-tracking';

describe('朝会報告リマインド通知自動送信機能', () => {
  test('reportDeadline が null のとき処理が中断される', () => {
    // Arrange: スタブ化した NotificationServiceAdapter
    const sendReminderNotificationStub = jest.fn();
    const notificationServiceAdapterStub = {
      sendReminderNotification: sendReminderNotificationStub,
    };

    // ログ出力をキャプチャするためのスパイ
    const logSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const input: SendDailyReportReminderInput = {
      scheduledTime: new Date('2024-01-15T08:30:00Z'),
      teamIds: ['team-001'],
      reportDeadlineTime: null, // 報告期限タイムスタンプが null
      notificationChannels: ['email', 'in_app', 'slack'],
    };

    // Act: メイン処理を実行
    const result: SendDailyReportReminderOutput = sendDailyReportReminder(
      input,
      notificationServiceAdapterStub
    );

    // Assert: NotificationServiceAdapter は呼び出されない
    expect(sendReminderNotificationStub).not.toHaveBeenCalled();

    // システムエラーログに期限タイムスタンプが null のメッセージが記録される
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('報告期限タイムスタンプが null のため処理中断')
    );

    // 処理終了ステータスが 'ABORTED'
    expect(result.status).toBe('ABORTED');

    // 送信件数は 0
    expect(result.sentCount).toBe(0);

    // 失敗件数は 0
    expect(result.failedCount).toBe(0);

    // Cleanup
    logSpy.mockRestore();
  });
});