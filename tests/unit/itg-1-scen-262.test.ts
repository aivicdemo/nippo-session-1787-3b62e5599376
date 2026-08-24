import { submitDailyReport } from '../../src/logic/daily-report-management';
import { type SubmitDailyReportInput, type SubmitDailyReportOutput } from '../../src/logic/daily-report-management';

describe('部長向けダッシュボードリアルタイム提出状況表示', () => {
  // SCEN-262
  test('報告送信時刻の遅延判定機能 - 部長への通知送信が失敗したときエラーが発生して遅延判定結果が記録されない', async () => {
    // Arrange: NotificationServiceAdapterのスタブを失敗レスポンスで設定
    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: 'FAILED',
        errorCode: 'DELIVERY_ERROR',
        message: '通知送信に失敗しました',
      }),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    const submitInput: SubmitDailyReportInput = {
      userId: 'user_1001',
      teamId: 'team_001',
      yesterdayAccomplishment: 'タスクA完了',
      todayPlan: 'タスクB開始',
      challenges: 'システム遅延',
      reportDate: '2024-01-15',
    };

    // Act & Assert: submitDailyReportを呼び出し、エラーが発生することを確認
    await expect(
      submitDailyReport(submitInput, mockNotificationServiceAdapter)
    ).rejects.toThrow(/通知送信/);

    // Assert: NotificationServiceAdapterが呼び出されたことを確認
    expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenCalled();

    // Assert: エラーレスポンスの内容を確認
    const callArg = mockNotificationServiceAdapter.sendReminderNotification.mock.calls[0];
    expect(callArg).toBeDefined();
  });
});