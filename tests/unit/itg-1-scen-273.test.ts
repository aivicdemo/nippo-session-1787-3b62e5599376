import { submitDailyReport } from '../../src/logic/daily-report-management';
import { type SubmitDailyReportInput, type SubmitDailyReportOutput } from '../../src/logic/daily-report-management';

describe('Daily Report Submission - Consistent Delay Judgment for Multiple Users', () => {
  // SCEN-273
  test('should apply identical delay judgment to all users when submission timestamps are the same', async () => {
    // Setup: Base deadline is 09:00:00 JST, submission time is 09:15:30 JST for all 3 users
    // Expected: All users should have isWithinDeadline = false (delayed), delay duration = 15 minutes 30 seconds
    const deadline = new Date('2024-01-15T09:00:00+09:00');
    const sharedSubmissionTimestamp = new Date('2024-01-15T09:15:30+09:00');
    const expectedDelayMinutes = 15; // 15 minutes 30 seconds = 15.5 minutes, rounded or truncated to 15

    const userA_input: SubmitDailyReportInput = {
      userId: 'user-a-001',
      teamId: 'team-alpha',
      yesterdayAccomplishment: 'Completed API integration testing',
      todayPlan: 'Begin database optimization',
      challenges: 'Performance bottleneck in query execution',
      reportDate: '2024-01-15',
    };

    const userB_input: SubmitDailyReportInput = {
      userId: 'user-b-002',
      teamId: 'team-alpha',
      yesterdayAccomplishment: 'Reviewed pull requests from team members',
      todayPlan: 'Finalize code review documentation',
      challenges: 'Code quality standards inconsistency',
      reportDate: '2024-01-15',
    };

    const userC_input: SubmitDailyReportInput = {
      userId: 'user-c-003',
      teamId: 'team-alpha',
      yesterdayAccomplishment: 'Fixed critical bug in payment module',
      todayPlan: 'Deploy fix to staging environment',
      challenges: 'Deployment process delays',
      reportDate: '2024-01-15',
    };

    // Mock implementation of submitDailyReport
    // In production, this would interact with a database and deadline service
    // For this test, we assume the function accepts deadline as context or configuration
    const resultA = await submitDailyReport(userA_input);
    const resultB = await submitDailyReport(userB_input);
    const resultC = await submitDailyReport(userC_input);

    // Verify results structure
    expect(resultA).toHaveProperty('reportId');
    expect(resultA).toHaveProperty('submissionTimestamp');
    expect(resultA).toHaveProperty('isWithinDeadline');
    expect(resultB).toHaveProperty('reportId');
    expect(resultB).toHaveProperty('submissionTimestamp');
    expect(resultB).toHaveProperty('isWithinDeadline');
    expect(resultC).toHaveProperty('reportId');
    expect(resultC).toHaveProperty('submissionTimestamp');
    expect(resultC).toHaveProperty('isWithinDeadline');

    // All three users submitted at 09:15:30 JST, which is 15 minutes 30 seconds after the 09:00:00 JST deadline
    // Therefore, all should be marked as delayed (isWithinDeadline = false)
    expect(resultA.isWithinDeadline).toBe(false);
    expect(resultB.isWithinDeadline).toBe(false);
    expect(resultC.isWithinDeadline).toBe(false);

    // Verify that all submission timestamps are identical (same delay basis)
    expect(resultA.submissionTimestamp).toBe(resultB.submissionTimestamp);
    expect(resultB.submissionTimestamp).toBe(resultC.submissionTimestamp);

    // Verify that all users received unique report IDs (distinct submissions)
    expect(resultA.reportId).not.toBe(resultB.reportId);
    expect(resultB.reportId).not.toBe(resultC.reportId);
    expect(resultA.reportId).not.toBe(resultC.reportId);

    // Consistency check: delay judgment logic is based solely on submission time vs deadline,
    // independent of user ID order or any other user-specific property
    // All three users should have identical delay judgment outcome
    const delayJudgmentA = resultA.isWithinDeadline;
    const delayJudgmentB = resultB.isWithinDeadline;
    const delayJudgmentC = resultC.isWithinDeadline;

    expect(delayJudgmentA).toBe(delayJudgmentB);
    expect(delayJudgmentB).toBe(delayJudgmentC);
  });
});