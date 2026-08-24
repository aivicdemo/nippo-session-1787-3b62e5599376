import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('Daily Report Management - submitDailyReport', () => {
  // SCEN-2529: [edge] 初回テスト報告の入力検証機能 - 必須項目がすべて入力されている場合、検証が合格となる
  test('should pass validation when all required fields are provided with valid content', async () => {
    const input = {
      userId: 'user-001',
      teamId: 'team-001',
      yesterdayAccomplishment: 'システム改善対応',
      todayPlan: 'テスト実施',
      challenges: 'パフォーマンス低下',
      reportDate: '2024-01-15',
    };

    const mockNotificationAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: 'delivered',
        userId: input.userId,
        timestamp: '2024-01-15T09:00:00Z',
      }),
      scheduleNotification: jest.fn().mockResolvedValue({
        scheduled: true,
        notificationId: 'notif-001',
      }),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        status: 'delivered',
        deliveredAt: '2024-01-15T09:00:00Z',
      }),
    };

    const result = await submitDailyReport(input, mockNotificationAdapter);

    expect(result).toBeDefined();
    expect(result.reportId).toBeDefined();
    expect(typeof result.reportId).toBe('string');
    expect(result.submissionTimestamp).toBeDefined();
    expect(result.isWithinDeadline).toBe(true);
  });
});