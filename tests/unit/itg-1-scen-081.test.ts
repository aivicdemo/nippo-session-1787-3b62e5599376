import { submitDailyReport } from '../../src/logic/daily-report-management';
import { type SubmitDailyReportInput, type SubmitDailyReportOutput } from '../../src/logic/daily-report-management';

describe('日報送信期限判定機能', () => {
  // SCEN-081
  test('朝会開始時刻の1秒後に送信された日報が期限超過と判定される', async () => {
    // 朝会開始時刻を09:00:00に設定
    const morningMeetingStartTime = new Date('2024-01-15T09:00:00Z');
    
    // システム時刻を09:00:01（朝会開始の1秒後）に設定
    const submissionTimestamp = new Date('2024-01-15T09:00:01Z');
    
    // 日報入力データ
    const reportInput: SubmitDailyReportInput = {
      userId: 'user-001',
      teamId: 'team-001',
      yesterdayAccomplishment: 'タスクA完了',
      todayPlan: 'タスクB開始',
      challenges: 'リソース不足',
      reportDate: '2024-01-15'
    };

    // NotificationServiceAdapterをモック化（実際のSlack/Teams APIへ通信しない）
    const mockNotificationAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        status: 'sent',
        deliveryId: 'delivery-001'
      }),
      scheduleNotification: jest.fn().mockResolvedValue({
        scheduleId: 'schedule-001'
      }),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        status: 'delivered'
      })
    };

    // TextAnalysisServiceAdapterをモック化
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ['リソース不足'],
        frequency: { 'リソース不足': 1 }
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        'リソース不足': 75
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        'リソース不足': 'high'
      })
    };

    // 日報送信を実行（朝会開始時刻を1秒超過した時刻で送信）
    const result: SubmitDailyReportOutput = await submitDailyReport(
      reportInput,
      {
        notificationAdapter: mockNotificationAdapter,
        textAnalysisAdapter: mockTextAnalysisAdapter,
        morningMeetingStartTime: morningMeetingStartTime,
        currentTimestamp: submissionTimestamp
      }
    );

    // 期限判定フラグが「超過（false）」に設定されていることを確認
    expect(result.isWithinDeadline).toBe(false);
    
    // 送信タイムスタンプが正確に記録されていることを確認
    expect(result.submissionTimestamp).toBe('2024-01-15T09:00:01Z');
    
    // 報告IDが発行されていることを確認
    expect(result.reportId).toBeDefined();
    expect(typeof result.reportId).toBe('string');
    expect(result.reportId.length).toBeGreaterThan(0);
  });
});