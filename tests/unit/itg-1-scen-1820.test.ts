import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';

describe('月次レポート生成機能 - スケジュール実行タイミング', () => {
  // SCEN-1820
  test('月初1日の午前8時59分59秒ではスケジュール実行がトリガーされない', () => {
    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn(),
      scheduleNotification: jest.fn(),
      getDeliveryStatus: jest.fn(),
    };

    const targetYear = 2024;
    const targetMonth = 1;
    const requestedByUserId = 'user-001';

    const input = {
      targetYear,
      targetMonth,
      requestedByUserId,
    };

    const realDateNow = Date.now;
    const scheduleCallLog: Array<{ timestamp: number; called: boolean }> = [];

    // システムクロックを月初1日の午前8時59分58秒に設定
    const baseTime = new Date(`${targetYear}-${String(targetMonth).padStart(2, '0')}-01T08:59:58Z`).getTime();
    jest.useFakeTimers();
    jest.setSystemTime(baseTime);

    mockNotificationServiceAdapter.scheduleNotification.mockImplementation(() => {
      scheduleCallLog.push({
        timestamp: Date.now(),
        called: true,
      });
      return Promise.resolve({ success: true });
    });

    // 午前8時59分58秒時点でスケジューラーを起動
    extractMonthlyReportData(input, mockNotificationServiceAdapter);

    // システムクロックを午前8時59分59秒に進める
    jest.advanceTimersByTime(1000);

    // 1秒待機（非同期処理を考慮）
    jest.runAllTimers();

    // 期待結果: 午前8時59分59秒の時点でscheduleNotificationメソッドが呼び出されていない
    expect(mockNotificationServiceAdapter.scheduleNotification).not.toHaveBeenCalled();
    expect(scheduleCallLog.length).toBe(0);

    jest.useRealTimers();
  });
});