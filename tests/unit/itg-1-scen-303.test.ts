import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';

describe('毎朝の定時にチームメンバーへ報告入力のリマインド通知を自動送信し、報告期限までの時間を表示する機能', () => {
  // SCEN-303: [edge] 報告期限の残り時間表示機能 - 期限までの残り時間が整数で割り切れない場合、端数部分が正しく丸められて表示される
  test('期限までの残り時間が整数で割り切れない場合、端数部分が正しく丸められて表示される', async () => {
    // テスト用の現在時刻（UTC）
    const currentTime1 = new Date('2026-08-19T08:00:00Z');
    const reportDeadlineTime = new Date('2026-08-19T09:30:45.500Z');
    const scheduledTime = new Date('2026-08-19T08:00:00Z');
    const teamIds = ['team-001', 'team-002'];
    const notificationChannels: ('email' | 'in_app' | 'slack')[] = ['email', 'slack'];

    // モック用のスタブ NotificationServiceAdapter を作成
    const mockNotificationService = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        userId: 'user-001',
        status: 'sent' as const,
        sentAt: new Date('2026-08-19T08:00:00Z'),
      }),
      scheduleNotification: jest.fn().mockResolvedValue(undefined),
      getDeliveryStatus: jest.fn().mockResolvedValue({ status: 'sent' }),
    };

    // 1回目の呼び出し：残り時間は 1時間30分45.5秒
    const input1: Parameters<typeof sendDailyReportReminder>[0] = {
      scheduledTime,
      teamIds,
      reportDeadlineTime,
      notificationChannels,
    };

    // jest.useFakeTimers で現在時刻をモック
    jest.useFakeTimers();
    jest.setSystemTime(currentTime1);

    // 残り時間の計算：1時間30分45.5秒 = 90分45.5秒
    // 端数切り上げの場合：91分、切り捨ての場合：90分
    const expectedRemainingMinutes1 = 90; // 切り捨て形式を期待値とする（45.5秒は考慮しない）
    // または切り上げの場合は 91

    const result1 = await sendDailyReportReminder(
      input1,
      mockNotificationService as any
    );

    // 1回目の結果を検証：remainingTimeMinutes が期待値の範囲内か確認
    expect(result1.remainingTimeMinutes).toBeGreaterThanOrEqual(90);
    expect(result1.remainingTimeMinutes).toBeLessThanOrEqual(91);
    expect(result1.sentCount).toBeGreaterThanOrEqual(0);
    expect(typeof result1.failedCount).toBe('number');
    expect(Array.isArray(result1.notificationDetails)).toBe(true);

    // 2回目のテスト：システム時刻を進める
    const currentTime2 = new Date('2026-08-19T09:00:00Z');
    jest.setSystemTime(currentTime2);

    // 残り時間：30分45.5秒 = 30分45.5秒
    // 端数切り上げの場合：31分、切り捨ての場合：30分
    const expectedRemainingMinutes2 = 30; // 切り捨て形式を期待値とする
    // または切り上げの場合は 31

    const result2 = await sendDailyReportReminder(
      input1,
      mockNotificationService as any
    );

    // 2回目の結果を検証
    expect(result2.remainingTimeMinutes).toBeGreaterThanOrEqual(30);
    expect(result2.remainingTimeMinutes).toBeLessThanOrEqual(31);

    // 端数丸め方式の一貫性を検証：両呼び出しの丸め方が同じであること
    // 1回目が91分（切り上げ）なら、2回目も31分（切り上げ）であるべき
    // 1回目が90分（切り捨て）なら、2回目も30分（切り捨て）であるべき
    const roundingStyle1 = result1.remainingTimeMinutes === 91 ? 'ceil' : 'floor';
    const roundingStyle2 = result2.remainingTimeMinutes === 31 ? 'ceil' : 'floor';

    expect(roundingStyle1).toBe(roundingStyle2);

    // 秒単位未満の端数が表示されないことを確認
    // remainingTimeMinutes は整数値のみ
    expect(Number.isInteger(result1.remainingTimeMinutes)).toBe(true);
    expect(Number.isInteger(result2.remainingTimeMinutes)).toBe(true);

    jest.useRealTimers();
  });
});