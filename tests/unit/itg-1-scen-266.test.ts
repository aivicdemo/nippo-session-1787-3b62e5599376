import { submitDailyReport } from '../../src/logic/daily-report-management';
import { type ReportSubmissionInput, type ReportSubmissionRecord } from '../../src/logic/daily-report-management';

describe('Daily Report Submission - Delay Detection', () => {
  // SCEN-266: [edge] 報告遅延判定機能 - 送信時刻が期限の1秒超過の場合、遅延ありと判定される
  test('should mark report as delayed when submission time exceeds deadline by 1 second', () => {
    const reportDeadline = new Date('2024-01-15T09:00:00Z');
    const submissionTimestamp = new Date('2024-01-15T09:00:01Z');

    const reportInput: ReportSubmissionInput = {
      reportId: 'report-12345',
      userId: 'user-001',
      submissionTimestamp: submissionTimestamp,
      reportContent: {
        yesterdayAccomplishment: 'Completed API integration testing and documentation review',
        todayPlan: 'Begin performance optimization and database indexing',
        challenges: 'Database query performance needs optimization to meet SLA requirements'
      }
    };

    const result: ReportSubmissionRecord = submitDailyReport(reportInput, reportDeadline);

    expect(result.recordId).toBeDefined();
    expect(result.reportId).toBe('report-12345');
    expect(result.submissionTimestamp).toEqual(submissionTimestamp);
    expect(result.isWithinDeadline).toBe(false);
    expect(result.deadlineComparisonResult.status).toBe('delayed');
    expect(result.deadlineComparisonResult.minutesBeforeDeadline).toBe(-1);
    expect(result.recordedAt).toBeDefined();
  });
});