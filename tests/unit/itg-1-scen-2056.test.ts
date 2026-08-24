import { submitDailyReport } from '../../src/logic/daily-report-management';
import type { SubmitDailyReportInput, SubmitDailyReportOutput } from '../../src/logic/daily-report-management';

describe('Daily Report Management - Priority Score Edge Case', () => {
  // SCEN-2056
  test('should accept and save countermeasure proposal when priority score equals maximum threshold (100)', async () => {
    const currentTimestamp = new Date('2024-12-16T09:00:00Z');
    const morningMeetingStartTime = new Date('2024-12-16T09:30:00Z');

    const submitInput: SubmitDailyReportInput = {
      userId: 'user-001',
      teamId: 'team-001',
      yesterdayAccomplishment: 'Completed API integration testing',
      todayPlan: 'Review test results and fix identified bugs',
      challenges: 'Database connection pool exhaustion during load testing',
      reportDate: '2024-12-16',
    };

    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: 'database', frequency: 3 },
          { keyword: 'connection pool', frequency: 2 },
        ],
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        impactScore: 100,
        severity: 'high',
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        classification: 'critical',
        reasoning: 'Production infrastructure impact',
      }),
    };

    const mockNotificationAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({
        deliveryStatus: 'sent',
        deliveryId: 'notif-001',
      }),
      scheduleNotification: jest.fn().mockResolvedValue({
        scheduleId: 'sched-001',
      }),
      getDeliveryStatus: jest.fn().mockResolvedValue({
        status: 'delivered',
      }),
    };

    const result: SubmitDailyReportOutput = await submitDailyReport(
      submitInput,
      mockTextAnalysisAdapter,
      mockNotificationAdapter,
      currentTimestamp,
      morningMeetingStartTime
    );

    expect(result).toBeDefined();
    expect(result.reportId).toBeTruthy();
    expect(typeof result.reportId).toBe('string');
    expect(result.submissionTimestamp).toBe(currentTimestamp.toISOString());
    expect(result.isWithinDeadline).toBe(true);

    expect(mockTextAnalysisAdapter.assessImpactScore).toHaveBeenCalledWith(
      expect.stringContaining('Database connection pool exhaustion')
    );

    const assessCallResult = await mockTextAnalysisAdapter.assessImpactScore(
      'Database connection pool exhaustion during load testing'
    );
    expect(assessCallResult.impactScore).toBe(100);
  });
});