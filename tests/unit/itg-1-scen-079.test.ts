import { submitDailyReport } from '../../src/logic/daily-report-management';
import { type SubmitDailyReportInput, type SubmitDailyReportOutput } from '../../src/logic/daily-report-management';

describe('Daily Report Submission - Deadline Judgment', () => {
  // SCEN-079: [edge] 日報送信期限判定機能 - 朝会開始時刻ちょうどに送信された日報が期限内と判定される
  test('should judge daily report sent exactly at morning meeting start time as within deadline', () => {
    const morningMeetingStartTime = '09:00:00';
    const submissionTimestampAtDeadline = '2026-08-20T09:00:00Z';

    const input: SubmitDailyReportInput = {
      userId: 'engineer-001',
      teamId: 'team-dev-001',
      yesterdayAccomplishment: 'Completed API integration testing and fixed 3 bugs in authentication module.',
      todayPlan: 'Start implementing new dashboard feature and attend code review session.',
      challenges: 'Database query performance needs optimization for large datasets.',
      reportDate: '2026-08-20',
    };

    const output: SubmitDailyReportOutput = submitDailyReport(
      input,
      new Date(submissionTimestampAtDeadline),
      morningMeetingStartTime
    );

    expect(output.reportId).toBeDefined();
    expect(output.reportId.length).toBeGreaterThan(0);

    expect(output.submissionTimestamp).toBe(submissionTimestampAtDeadline);

    expect(output.isWithinDeadline).toBe(true);
  });
});