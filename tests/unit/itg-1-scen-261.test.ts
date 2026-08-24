import { submitDailyReport } from '../../src/logic/daily-report-management';
import type { ReportSubmissionInput, ReportSubmissionRecord } from '../../src/logic/daily-report-management';

describe('Daily Report Management - Real-time Submission Status Display', () => {
  // SCEN-261: [error] 報告送信時刻の遅延判定機能 - 開発エンジニアの ID が空文字列のとき、エラーが発生して処理が進まない
  test('should reject submission when engineer user ID is empty string', async () => {
    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({ success: true }),
      scheduleNotification: jest.fn().mockResolvedValue({ success: true }),
      getDeliveryStatus: jest.fn().mockResolvedValue({ status: 'sent' }),
    };

    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest
        .fn()
        .mockResolvedValue({ keywords: ['テスト'], frequency: 1 }),
      assessImpactScore: jest.fn().mockResolvedValue({ impactScore: 50 }),
      classifyIssueSeverity: jest
        .fn()
        .mockResolvedValue({ severity: 'medium' }),
    };

    const invalidSubmissionInput: ReportSubmissionInput = {
      reportId: 'report-001',
      userId: '',
      submissionTimestamp: new Date('2024-01-15T08:30:00Z'),
      reportContent: {
        yesterdayAccomplishment: 'Completed feature implementation',
        todayPlan: 'Code review and testing',
        challenges: 'Performance optimization needed',
      },
    };

    await expect(
      submitDailyReport(invalidSubmissionInput, {
        notificationServiceAdapter: mockNotificationServiceAdapter,
        textAnalysisServiceAdapter: mockTextAnalysisServiceAdapter,
      })
    ).rejects.toThrow(/ユーザーID/);
  });
});