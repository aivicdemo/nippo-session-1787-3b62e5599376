import { submitDailyReport } from '../../src/logic/daily-report-management';
import { type SubmitDailyReportInput, type SubmitDailyReportOutput } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム - 日報送信と操作習熟度判定', () => {
  // SCEN-2497: [edge] 操作習熟度スコア自動計算 - 操作習熟度スコアが69点のとき再実習対象と判定される
  test('should judge user with proficiency score of 69 as needing retraining', async () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ['database', 'performance'],
        frequencies: [3, 2],
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        impactScore: 75,
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        severity: 'medium',
      }),
    };

    const mockNotificationServiceAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        deliveryStatus: 'sent',
      }),
      scheduleNotification: jest.fn().mockResolvedValue({
        scheduled: true,
      }),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        status: 'sent',
      }),
    };

    const input: SubmitDailyReportInput = {
      userId: 'eng-001',
      teamId: 'team-alpha',
      yesterdayAccomplishment:
        'Completed database optimization review and prepared improvement proposal for team meeting',
      todayPlan:
        'Implement performance fixes identified in yesterdays review and run comprehensive tests',
      challenges:
        'Database query performance degradation affecting application response times',
      reportDate: '2025-01-15',
    };

    const result: SubmitDailyReportOutput = await submitDailyReport(
      input,
      mockTextAnalysisServiceAdapter,
      mockNotificationServiceAdapter,
      {
        systemOperationCount: 8,
        operationDurationSeconds: 420,
        errorRate: 0.125,
        baseScore: 70,
      }
    );

    expect(result).toBeDefined();
    expect(result.reportId).toBeDefined();
    expect(typeof result.reportId).toBe('string');
    expect(result.reportId.length).toBeGreaterThan(0);

    expect(result.submissionTimestamp).toBeDefined();
    expect(typeof result.submissionTimestamp).toBe('string');
    const submittedTime = new Date(result.submissionTimestamp);
    expect(submittedTime.getTime()).toBeLessThanOrEqual(Date.now());
    expect(submittedTime.getTime()).toBeGreaterThan(Date.now() - 5000);

    expect(result.isWithinDeadline).toBe(true);

    expect(result.proficiencyScore).toBe(69);
    expect(result.proficiencyJudgement).toBe('NEEDS_RETRAINING');
    expect(result.needsRetrain).toBe(true);

    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.stringContaining('Database'),
      })
    );

    expect(mockNotificationServiceAdapter.sendReminderNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'eng-001',
      })
    );
  });
});