import { submitDailyReport } from '../../src/logic/daily-report-management';
import type { SubmitDailyReportInput, SubmitDailyReportOutput } from '../../src/logic/daily-report-management';

describe('Daily Report Submission - Duplicate Submission Handling', () => {
  test('SCEN-272: duplicate submissions from same user at same timestamp use earliest submission time for deadline comparison', () => {
    const userId = 'user-001';
    const teamId = 'team-001';
    const reportDate = '2024-01-15';
    const submissionTimestamp = new Date('2024-01-15T08:55:00Z');
    const deadlineTime = new Date('2024-01-15T09:00:00Z');

    const firstSubmissionInput: SubmitDailyReportInput = {
      userId,
      teamId,
      yesterdayAccomplishment: 'Completed Task X',
      todayPlan: 'Start Task Y',
      challenges: 'Bug Z identified',
      reportDate,
    };

    const firstResult: SubmitDailyReportOutput = submitDailyReport(
      firstSubmissionInput,
      submissionTimestamp,
      deadlineTime
    );

    expect(firstResult.reportId).toBeDefined();
    expect(firstResult.reportId).toMatch(/^report-/);
    expect(firstResult.submissionTimestamp).toBe(submissionTimestamp.toISOString());
    expect(firstResult.isWithinDeadline).toBe(true);

    const secondSubmissionInput: SubmitDailyReportInput = {
      userId,
      teamId,
      yesterdayAccomplishment: 'Completed Task X',
      todayPlan: 'Start Task Y',
      challenges: 'Bug Z identified',
      reportDate,
    };

    const secondResult: SubmitDailyReportOutput = submitDailyReport(
      secondSubmissionInput,
      submissionTimestamp,
      deadlineTime
    );

    expect(secondResult.reportId).toBeDefined();
    expect(secondResult.submissionTimestamp).toBe(submissionTimestamp.toISOString());
    expect(secondResult.isWithinDeadline).toBe(true);

    expect(firstResult.submissionTimestamp).toBe(secondResult.submissionTimestamp);
  });
});