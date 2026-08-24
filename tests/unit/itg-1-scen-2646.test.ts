import { submitDailyReport } from '../../src/logic/daily-report-management';
import { type NotificationServiceAdapter } from '../../src/adapters/notification-service-adapter';
import { type TextAnalysisServiceAdapter } from '../../src/adapters/text-analysis-service-adapter';

describe('課題の影響度判定と優先度スコア表示機能', () => {
  // SCEN-2646
  test('TextAnalysisServiceAdapter の classifyIssueSeverity が失敗したとき、分類エラーハンドリングが実行される', async () => {
    const reportId = 'report-001';
    const userId = 'user-001';
    const submissionTimestamp = new Date('2024-01-15T09:00:00Z');
    const morningMeetingStartTime = new Date('2024-01-15T09:30:00Z');

    const reportContent = {
      yesterdayAccomplishment: 'APIの設計書を作成した',
      todayPlan: 'API実装を開始する',
      challenges: 'サーバー障害が発生している'
    };

    const mockNotificationAdapter: NotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: 'sent',
        deliveryTimestamp: new Date('2024-01-15T08:30:00Z')
      }),
      scheduleNotification: jest.fn().mockResolvedValue({
        scheduledId: 'schedule-001'
      }),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        status: 'delivered'
      })
    };

    const mockTextAnalysisAdapter: TextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: 'サーバー障害', frequency: 1 }
        ]
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        impactScore: 85
      }),
      classifyIssueSeverity: jest.fn().mockRejectedValue(
        new Error('API request failed: timeout')
      )
    };

    let errorMessage = '';
    let systemLogEntry = '';

    const originalConsoleError = console.error;
    console.error = jest.fn((msg: string) => {
      systemLogEntry = msg;
    });

    try {
      await submitDailyReport(
        {
          reportId,
          userId,
          submissionTimestamp,
          reportContent
        },
        mockNotificationAdapter,
        mockTextAnalysisAdapter
      );
    } catch (error) {
      if (error instanceof Error) {
        errorMessage = error.message;
      }
    }

    console.error = originalConsoleError;

    expect(mockTextAnalysisAdapter.classifyIssueSeverity).toHaveBeenCalledWith(
      'サーバー障害が発生している'
    );
    expect(errorMessage).toMatch(/分類エラー/);
    expect(systemLogEntry).toMatch(/TextAnalysisServiceAdapter\.classifyIssueSeverity/);
  });
});