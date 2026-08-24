import { submitDailyReport } from '../../src/logic/daily-report-management';
import type { SubmitDailyReportInput, SubmitDailyReportOutput } from '../../src/logic/daily-report-management';

describe('Daily Report Management - submitDailyReport', () => {
  // SCEN-310: [normal] 日報入力フォーム検証機能 - 複数回の送信で同じ入力内容に対して一貫して検証結果が同じである
  test('should return consistent validation results across multiple submissions with identical input', async () => {
    const fixed_timestamp = new Date('2024-01-15T08:30:00Z');
    const fixed_report_date = '2024-01-15';
    const fixed_user_id = 'user-12345';
    const fixed_team_id = 'team-67890';

    const input: SubmitDailyReportInput = {
      userId: fixed_user_id,
      teamId: fixed_team_id,
      yesterdayAccomplishment: 'ドキュメント作成',
      todayPlan: 'レビュー実施',
      challenges: 'パフォーマンス改善',
      reportDate: fixed_report_date,
    };

    const mock_notification_adapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        deliveryStatus: 'success',
        sentAt: fixed_timestamp.toISOString(),
      }),
      scheduleNotification: jest.fn().mockResolvedValue({
        scheduledId: 'schedule-001',
      }),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        status: 'delivered',
      }),
    };

    const mock_text_analysis_adapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ['パフォーマンス', '改善'],
        frequencies: [2, 1],
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        impactScore: 75,
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        severity: 'high',
      }),
    };

    const result1: SubmitDailyReportOutput = await submitDailyReport(
      input,
      mock_notification_adapter,
      mock_text_analysis_adapter,
    );

    const result2: SubmitDailyReportOutput = await submitDailyReport(
      input,
      mock_notification_adapter,
      mock_text_analysis_adapter,
    );

    const result3: SubmitDailyReportOutput = await submitDailyReport(
      input,
      mock_notification_adapter,
      mock_text_analysis_adapter,
    );

    expect(result1.reportId).toBeDefined();
    expect(result1.reportId.length).toBeGreaterThan(0);
    expect(result1.submissionTimestamp).toBeDefined();
    expect(typeof result1.isWithinDeadline).toBe('boolean');

    expect(result2.reportId).toBeDefined();
    expect(result2.reportId.length).toBeGreaterThan(0);
    expect(result2.submissionTimestamp).toBeDefined();
    expect(typeof result2.isWithinDeadline).toBe('boolean');

    expect(result3.reportId).toBeDefined();
    expect(result3.reportId.length).toBeGreaterThan(0);
    expect(result3.submissionTimestamp).toBeDefined();
    expect(typeof result3.isWithinDeadline).toBe('boolean');

    expect(result1.isWithinDeadline).toBe(result2.isWithinDeadline);
    expect(result2.isWithinDeadline).toBe(result3.isWithinDeadline);
  });
});