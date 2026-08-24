import { submitDailyReport } from '../../src/logic/daily-report-management';
import { type SubmitDailyReportInput, type SubmitDailyReportOutput } from '../../src/logic/daily-report-management';

describe('submitDailyReport - 初回テスト報告入力検証', () => {
  // SCEN-2637
  test('報告内容が null のとき不合格判定となる', () => {
    const notificationServiceStub = {
      sendReminderNotification: jest.fn().mockResolvedValue({ status: 'success' }),
      scheduleNotification: jest.fn().mockResolvedValue({ status: 'success' }),
      getDeliveryStatus: jest.fn().mockResolvedValue({ status: 'pending' }),
    };

    const textAnalysisServiceStub = {
      extractKeywords: jest.fn().mockResolvedValue({ keywords: [], frequency: [] }),
      assessImpactScore: jest.fn().mockResolvedValue({ score: 0 }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({ severity: 'low' }),
    };

    const inputWithNullContent: SubmitDailyReportInput = {
      userId: 'user-001',
      teamId: 'team-001',
      yesterdayAccomplishment: null as any,
      todayPlan: '今日の予定テキスト',
      challenges: '抱えている課題テキスト',
      reportDate: '2024-01-15',
    };

    const result = submitDailyReport(
      inputWithNullContent,
      notificationServiceStub,
      textAnalysisServiceStub
    );

    expect(result.isValid).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors).toContain(expect.stringMatching(/報告内容/));
    expect(notificationServiceStub.sendReminderNotification).not.toHaveBeenCalled();
    expect(textAnalysisServiceStub.extractKeywords).not.toHaveBeenCalled();
  });
});