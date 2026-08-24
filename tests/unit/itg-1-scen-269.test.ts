import { submitDailyReport } from '../../src/logic/daily-report-management';
import { type SubmitDailyReportInput, type SubmitDailyReportOutput } from '../../src/logic/daily-report-management';

describe('Daily Report Submission - Cross-Month Deadline Delay Detection', () => {
  // SCEN-269: [edge] 報告遅延判定機能 - 月をまたいで期限を設定した場合、遅延判定が正確に実行される
  test('should correctly detect delay status when deadline crosses month boundary', async () => {
    // Setup: Deadline is January 31, 09:00 UTC
    const deadline_jan_31_0900 = new Date('2024-01-31T09:00:00Z');
    
    // Test input for submission
    const submitInput: SubmitDailyReportInput = {
      userId: 'eng-001',
      teamId: 'team-alpha',
      yesterdayAccomplishment: 'Completed API integration testing',
      todayPlan: 'Review PR feedback and deploy to staging',
      challenges: 'Database migration script needs validation',
      reportDate: '2024-01-30',
    };

    // Scenario 1: Current time is February 1, 08:30 UTC (before deadline has passed into next month)
    // Deadline: Jan 31, 09:00. Current: Feb 1, 08:30.
    // Feb 1 08:30 is 23 hours 30 minutes after Jan 31 09:00, so it IS past deadline.
    // Expected: isWithinDeadline should be false because we've crossed into the next month after the deadline.
    const submissionTime_feb_1_0830 = new Date('2024-02-01T08:30:00Z');
    
    // Mock: Simulate submission with Feb 1 08:30 timestamp
    // Since submitDailyReport needs to determine if submissionTime is within deadline,
    // we expect isWithinDeadline to be false (Feb 1 08:30 > Jan 31 09:00).
    
    const result_feb_1_0830: SubmitDailyReportOutput = {
      reportId: 'report-20240130-eng001',
      submissionTimestamp: submissionTime_feb_1_0830.toISOString(),
      isWithinDeadline: false, // Feb 1 08:30 is after Jan 31 09:00 deadline
    };

    // Scenario 2: Current time is February 1, 10:00 UTC (clearly after deadline passed into next month)
    // Deadline: Jan 31, 09:00. Current: Feb 1, 10:00.
    // Feb 1 10:00 is definitely past the deadline.
    // Expected: isWithinDeadline should be false.
    const submissionTime_feb_1_1000 = new Date('2024-02-01T10:00:00Z');

    const result_feb_1_1000: SubmitDailyReportOutput = {
      reportId: 'report-20240130-eng001',
      submissionTimestamp: submissionTime_feb_1_1000.toISOString(),
      isWithinDeadline: false, // Feb 1 10:00 is after Jan 31 09:00 deadline
    };

    // Execute first submission scenario (Feb 1 08:30)
    // The function should accept the input and return output indicating delay status
    const output_feb_1_0830 = await submitDailyReport(
      submitInput,
      deadline_jan_31_0900,
      submissionTime_feb_1_0830
    );

    // Verify: Feb 1 08:30 submission should be marked as NOT within deadline
    // (because it's after Jan 31 09:00, crossing month boundary)
    expect(output_feb_1_0830.isWithinDeadline).toBe(false);
    expect(output_feb_1_0830.reportId).toBeDefined();
    expect(output_feb_1_0830.submissionTimestamp).toBe(submissionTime_feb_1_0830.toISOString());

    // Execute second submission scenario (Feb 1 10:00)
    const output_feb_1_1000 = await submitDailyReport(
      submitInput,
      deadline_jan_31_0900,
      submissionTime_feb_1_1000
    );

    // Verify: Feb 1 10:00 submission should also be marked as NOT within deadline
    expect(output_feb_1_1000.isWithinDeadline).toBe(false);
    expect(output_feb_1_1000.reportId).toBeDefined();
    expect(output_feb_1_1000.submissionTimestamp).toBe(submissionTime_feb_1_1000.toISOString());

    // Cross-check: Both submissions should have delay flag set consistently
    // Feb 1 08:30 is 23h 30m after Jan 31 09:00 → delayed
    // Feb 1 10:00 is 24h 60m after Jan 31 09:00 → delayed
    // Both should reflect the same "delayed" status
    expect(output_feb_1_0830.isWithinDeadline).toEqual(output_feb_1_1000.isWithinDeadline);
  });
});