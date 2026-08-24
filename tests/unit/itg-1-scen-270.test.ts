import { submitDailyReport } from '../../src/logic/daily-report-management';
import { type SubmitDailyReportInput, type SubmitDailyReportOutput } from '../../src/logic/daily-report-management';

describe('Daily Report Submission - Month-End Deadline Edge Case', () => {
  test('SCEN-270: [edge] Report delay judgment executed accurately when deadline is set to end of month at 23:59:59', () => {
    const reportDeadline = new Date('2024-01-31T23:59:59Z');
    const mockNotificationAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({ success: true, deliveryStatus: 'sent' }),
      scheduleNotification: jest.fn().mockResolvedValue({ scheduled: true }),
      getDeliveryStatus: jest.fn().mockResolvedValue({ status: 'sent' }),
    };
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([
        { keyword: 'database', frequency: 2 },
        { keyword: 'API', frequency: 1 },
      ]),
      assessImpactScore: jest.fn().mockResolvedValue(75),
      classifyIssueSeverity: jest.fn().mockResolvedValue('medium'),
    };

    // User 1: Submit at 23:58:00 (1 minute before deadline - should be on time)
    const user1SubmissionTime = new Date('2024-01-31T23:58:00Z');
    const user1Input: SubmitDailyReportInput = {
      userId: 'user-001',
      teamId: 'team-001',
      yesterdayAccomplishment: 'Completed database optimization task.',
      todayPlan: 'Review API integration results.',
      challenges: 'Database connection timeout issues.',
      reportDate: '2024-01-31',
    };
    const user1Result = submitDailyReport(user1Input, user1SubmissionTime, reportDeadline, mockNotificationAdapter, mockTextAnalysisAdapter);
    expect(user1Result.isWithinDeadline).toBe(true);
    expect(new Date(user1Result.submissionTimestamp).getTime()).toBe(user1SubmissionTime.getTime());

    // User 2: Submit at 23:59:00 (exactly at deadline minute - should be on time)
    const user2SubmissionTime = new Date('2024-01-31T23:59:00Z');
    const user2Input: SubmitDailyReportInput = {
      userId: 'user-002',
      teamId: 'team-001',
      yesterdayAccomplishment: 'Tested authentication module.',
      todayPlan: 'Deploy staging environment.',
      challenges: 'Deployment script compatibility issues.',
      reportDate: '2024-01-31',
    };
    const user2Result = submitDailyReport(user2Input, user2SubmissionTime, reportDeadline, mockNotificationAdapter, mockTextAnalysisAdapter);
    expect(user2Result.isWithinDeadline).toBe(true);
    expect(new Date(user2Result.submissionTimestamp).getTime()).toBe(user2SubmissionTime.getTime());

    // User 3: Submit at 23:59:59 (1 second before deadline - should be on time)
    const user3SubmissionTime = new Date('2024-01-31T23:59:59Z');
    const user3Input: SubmitDailyReportInput = {
      userId: 'user-003',
      teamId: 'team-001',
      yesterdayAccomplishment: 'Fixed critical bug in payment module.',
      todayPlan: 'Conduct code review for feature branch.',
      challenges: 'Performance degradation in production.',
      reportDate: '2024-01-31',
    };
    const user3Result = submitDailyReport(user3Input, user3SubmissionTime, reportDeadline, mockNotificationAdapter, mockTextAnalysisAdapter);
    expect(user3Result.isWithinDeadline).toBe(true);
    expect(new Date(user3Result.submissionTimestamp).getTime()).toBe(user3SubmissionTime.getTime());

    // User 4: Submit at 00:00:01 next day (1 second after deadline - should be delayed)
    const user4SubmissionTime = new Date('2024-02-01T00:00:01Z');
    const user4Input: SubmitDailyReportInput = {
      userId: 'user-004',
      teamId: 'team-001',
      yesterdayAccomplishment: 'Completed security audit of user dashboard.',
      todayPlan: 'Implement feedback from code review.',
      challenges: 'Security vulnerability found in session management.',
      reportDate: '2024-01-31',
    };
    const user4Result = submitDailyReport(user4Input, user4SubmissionTime, reportDeadline, mockNotificationAdapter, mockTextAnalysisAdapter);
    expect(user4Result.isWithinDeadline).toBe(false);
    expect(new Date(user4Result.submissionTimestamp).getTime()).toBe(user4SubmissionTime.getTime());

    // Verify that all results have valid reportId and submission timestamp
    expect(user1Result.reportId).toBeDefined();
    expect(user1Result.reportId.length).toBeGreaterThan(0);
    expect(user2Result.reportId).toBeDefined();
    expect(user2Result.reportId.length).toBeGreaterThan(0);
    expect(user3Result.reportId).toBeDefined();
    expect(user3Result.reportId.length).toBeGreaterThan(0);
    expect(user4Result.reportId).toBeDefined();
    expect(user4Result.reportId.length).toBeGreaterThan(0);

    // Verify boundary condition: difference of exactly 2 seconds between User 3 and User 4
    const timeDifference = new Date(user4Result.submissionTimestamp).getTime() - new Date(user3Result.submissionTimestamp).getTime();
    expect(timeDifference).toBe(2000); // 2 seconds difference

    // Verify that the delay judgment flips correctly at the boundary
    expect(user3Result.isWithinDeadline).not.toBe(user4Result.isWithinDeadline);
  });
});