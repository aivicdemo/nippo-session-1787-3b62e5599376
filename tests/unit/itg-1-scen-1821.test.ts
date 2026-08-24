import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';

describe('月次レポート生成機能 - スケジューラー実行トリガー', () => {
  let originalDateNow: () => number;
  let mockNotificationServiceAdapter: any;

  beforeEach(() => {
    // システム時刻をモック化：月初1日の午前9時00分01秒（JST）
    // 2024年1月1日 09:00:01 JST = 2023年12月31日 00:00:01 UTC
    const targetTimeMs = new Date('2024-01-01T00:00:01Z').getTime();
    originalDateNow = Date.now;
    Date.now = jest.fn(() => targetTimeMs);

    // NotificationServiceAdapterのスタブ
    mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: 'sent',
        deliveryId: 'mock-delivery-001',
      }),
      scheduleNotification: jest.fn().mockResolvedValue({
        scheduleId: 'mock-schedule-001',
        scheduledTime: '2024-01-01T00:00:01Z',
        status: 'scheduled',
      }),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        status: 'delivered',
      }),
    };
  });

  afterEach(() => {
    Date.now = originalDateNow;
    jest.clearAllMocks();
  });

  // SCEN-1821
  test('月初1日の午前9時00分01秒ではスケジュール実行がトリガーされている', async () => {
    const targetYear = 2024;
    const targetMonth = 1;
    const requestedByUserId = 'user-admin-001';

    const result = await extractMonthlyReportData(
      {
        targetYear,
        targetMonth,
        requestedByUserId,
        teamIdFilter: undefined,
      },
      mockNotificationServiceAdapter
    );

    // スケジューラーの実行状態ログを検証
    expect(result).toBeDefined();
    expect(result.extractionPeriodStart).toBe('2024-01-01T00:00:00Z');
    expect(result.extractionPeriodEnd).toBe('2024-01-31T23:59:59Z');
    expect(result.totalReportCount).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);
    expect(result.extractedAt).toBe('2024-01-01T00:00:01Z');

    // NotificationServiceAdapterのscheduleNotificationメソッドが1回呼び出されたことを確認
    expect(mockNotificationServiceAdapter.scheduleNotification).toHaveBeenCalledTimes(1);

    // scheduleNotificationの呼び出し引数を検証
    const scheduleCall = mockNotificationServiceAdapter.scheduleNotification.mock.calls[0];
    expect(scheduleCall).toBeDefined();
    expect(scheduleCall[0]).toMatchObject({
      targetYear,
      targetMonth,
      requestedByUserId,
    });

    // reportsByTeamが配列であることを確認
    expect(Array.isArray(result.reportsByTeam)).toBe(true);

    // 各TeamReportSummaryが正しい構造を持つことを確認
    result.reportsByTeam.forEach((teamSummary) => {
      expect(teamSummary.teamId).toBeDefined();
      expect(typeof teamSummary.teamId).toBe('string');
      expect(teamSummary.reportCount).toBeGreaterThanOrEqual(0);
      expect(typeof teamSummary.reportCount).toBe('number');
      expect(teamSummary.submissionRate).toBeGreaterThanOrEqual(0);
      expect(teamSummary.submissionRate).toBeLessThanOrEqual(100);
      expect(Array.isArray(teamSummary.reportIds)).toBe(true);
    });

    // 外部APIへの実通信が発生していないことを確認（スタブが使用されていることを検証）
    expect(mockNotificationServiceAdapter.sendReminderNotification).not.toHaveBeenCalled();
    expect(mockNotificationServiceAdapter.getDeliveryStatus).not.toHaveBeenCalled();
  });
});