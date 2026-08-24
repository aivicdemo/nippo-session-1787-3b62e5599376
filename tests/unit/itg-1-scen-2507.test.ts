import { submitDailyReport } from '../../src/logic/daily-report-management';
import type { SubmitDailyReportInput, SubmitDailyReportOutput } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム - 日報送信機能', () => {
  // SCEN-2507: [normal] 初回テスト報告の入力検証機能 - 入力テキストが品質基準（最小文字数以上）を満たす場合に報告が受理される
  test('すべてのフィールドが品質基準を満たす場合、入力検証に合格して報告が受理される', () => {
    const submissionTimestamp = new Date('2024-01-15T08:30:00Z');
    const reportDate = '2024-01-15';
    
    const input: SubmitDailyReportInput = {
      userId: 'user-001',
      teamId: 'team-engineering',
      yesterdayAccomplishment: 'Completed API integration testing for user authentication module. Identified and fixed 3 critical bugs in token validation logic. Documented all changes in the wiki.',
      todayPlan: 'Continue with database optimization task. Review pull requests from team members. Conduct code review session at 2 PM. Update project timeline documentation.',
      challenges: 'Database query performance needs improvement. Team communication delays due to timezone differences.',
      reportDate: reportDate,
    };

    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: 'API integration', frequency: 1, confidence: 0.95 },
          { keyword: 'database optimization', frequency: 1, confidence: 0.92 },
        ],
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        impactScore: 65,
        severity: 'medium',
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        classification: 'medium',
      }),
    };

    const mockNotificationAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        notificationId: 'notif-001',
        status: 'delivered',
      }),
      scheduleNotification: jest.fn().mockResolvedValue({
        scheduleId: 'schedule-001',
        status: 'scheduled',
      }),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        status: 'delivered',
        timestamp: submissionTimestamp.toISOString(),
      }),
    };

    const result: SubmitDailyReportOutput = submitDailyReport(
      input,
      mockTextAnalysisAdapter,
      mockNotificationAdapter,
      submissionTimestamp
    );

    expect(result).toBeDefined();
    expect(result.reportId).toBeDefined();
    expect(result.reportId).toMatch(/^report-/);
    expect(result.submissionTimestamp).toEqual(submissionTimestamp.toISOString());
    expect(result.isWithinDeadline).toBe(true);
    
    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalledWith(input.challenges);
    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalledTimes(1);
    
    expect(mockNotificationAdapter.sendReminderNotification).toHaveBeenCalled();
  });
});