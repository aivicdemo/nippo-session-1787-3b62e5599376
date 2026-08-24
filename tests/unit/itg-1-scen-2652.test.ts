import { submitDailyReport } from '../../src/logic/daily-report-management';
import { type SubmitDailyReportInput, type SubmitDailyReportOutput } from '../../src/logic/daily-report-management';

describe('Daily Report Management - Impact Score Validation', () => {
  // SCEN-2652: [error] 初回テスト報告入力検証機能 - 影響度スコアが負の値のとき不合格判定となる
  test('should reject report submission when impact score is negative', async () => {
    // Arrange
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ['システム連携エラー'],
        frequency: { 'システム連携エラー': 1 },
      }),
      assessImpactScore: jest.fn().mockResolvedValue(-5),
      classifyIssueSeverity: jest.fn().mockResolvedValue('high'),
    };

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: 'sent',
        deliveryTimestamp: new Date('2024-01-15T09:30:00Z').toISOString(),
      }),
      scheduleNotification: jest.fn().mockResolvedValue({ scheduled: true }),
      getDeliveryStatus: jest.fn().mockResolvedValue({ status: 'sent' }),
    };

    const submitDailyReportInput: SubmitDailyReportInput = {
      userId: 'user-001',
      teamId: 'team-001',
      yesterdayAccomplishment: 'Completed API integration testing',
      todayPlan: 'Review test results and deploy',
      challenges: 'システム連携エラーが発生',
      reportDate: '2024-01-15',
    };

    // Act & Assert
    await expect(
      submitDailyReport(
        submitDailyReportInput,
        mockTextAnalysisServiceAdapter,
        mockNotificationServiceAdapter,
      ),
    ).rejects.toThrow(/影響度スコア/);
  });
});