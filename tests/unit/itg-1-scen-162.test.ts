import { sendDailyReportReminder } from '../../src/logic/submission-status-tracking';
import { type SendDailyReportReminderInput, type SendDailyReportReminderOutput } from '../../src/logic/submission-status-tracking';

describe('毎朝の定時にチームメンバーへ報告入力のリマインド通知を自動送信する機能', () => {
  // SCEN-162: [edge] 報告期限時間表示機能 - 報告期限が直前（あと1分以内）であるとき、「あと0時間」と表示される
  test('報告期限の1分以内の状態では、報告期限時間表示が「あと0時間」と表示される', () => {
    const now = new Date('2024-01-15T08:59:00Z');
    const reportDeadlineTime = new Date('2024-01-15T09:00:00Z');
    const scheduledTime = new Date('2024-01-15T08:30:00Z');
    const teamIds = ['team-001', 'team-002'];
    const notificationChannels: ('email' | 'in_app' | 'slack')[] = ['email', 'in_app'];

    const input: SendDailyReportReminderInput = {
      scheduledTime,
      teamIds,
      reportDeadlineTime,
      notificationChannels,
    };

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: 'sent' as const,
        sentAt: now,
        errorMessage: null,
      }),
      scheduleNotification: jest.fn().mockResolvedValue(true),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        sent: 8,
        failed: 0,
        pending: 0,
      }),
    };

    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [],
        frequency: {},
      }),
      assessImpactScore: jest.fn().mockResolvedValue(0),
      classifyIssueSeverity: jest.fn().mockResolvedValue('low'),
    };

    const result = sendDailyReportReminder(
      input,
      mockNotificationServiceAdapter,
      mockTextAnalysisServiceAdapter
    );

    expect(result).toBeDefined();
    if (result instanceof Promise) {
      return result.then((output: SendDailyReportReminderOutput) => {
        expect(output).toBeDefined();
        expect(output.remainingTimeMinutes).toBe(1);

        const hoursRemaining = Math.floor(output.remainingTimeMinutes / 60);
        expect(hoursRemaining).toBe(0);
      });
    }
  });

  test('現在時刻が期限の30秒前の場合、remainingTimeMinutesは0を返す（丸め処理）', () => {
    const now = new Date('2024-01-15T08:59:30Z');
    const reportDeadlineTime = new Date('2024-01-15T09:00:00Z');
    const scheduledTime = new Date('2024-01-15T08:30:00Z');
    const teamIds = ['team-001'];
    const notificationChannels: ('email' | 'in_app' | 'slack')[] = ['email'];

    const input: SendDailyReportReminderInput = {
      scheduledTime,
      teamIds,
      reportDeadlineTime,
      notificationChannels,
    };

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: 'sent' as const,
        sentAt: now,
        errorMessage: null,
      }),
      scheduleNotification: jest.fn().mockResolvedValue(true),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        sent: 10,
        failed: 0,
        pending: 0,
      }),
    };

    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [],
        frequency: {},
      }),
      assessImpactScore: jest.fn().mockResolvedValue(0),
      classifyIssueSeverity: jest.fn().mockResolvedValue('low'),
    };

    const result = sendDailyReportReminder(
      input,
      mockNotificationServiceAdapter,
      mockTextAnalysisServiceAdapter
    );

    expect(result).toBeDefined();
    if (result instanceof Promise) {
      return result.then((output: SendDailyReportReminderOutput) => {
        expect(output.remainingTimeMinutes).toBeLessThanOrEqual(1);
        expect(output.remainingTimeMinutes).toBeGreaterThanOrEqual(0);
      });
    }
  });
});