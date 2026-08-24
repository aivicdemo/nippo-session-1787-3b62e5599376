import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';
import { type AggregateReportSubmissionStatusInput, type ReportSubmissionStatusSummary } from '../../src/logic/submission-status-tracking';

describe('Report Submission Status Tracking', () => {
  // SCEN-396
  test('should aggregate report submission status with 1 submitted member out of 1 total member', () => {
    const input: AggregateReportSubmissionStatusInput = {
      teamId: 'team-001',
      reportDate: '2024-01-15',
      requestUserId: 'manager-001',
      includeDelayedSubmissions: true,
    };

    const result: ReportSubmissionStatusSummary = aggregateReportSubmissionStatus(input);

    expect(result.teamId).toBe('team-001');
    expect(result.reportDate).toBe('2024-01-15');
    expect(result.totalMembers).toBe(1);
    expect(result.submittedCount).toBe(1);
    expect(result.unsubmittedCount).toBe(0);
    expect(result.delayedSubmissionCount).toBe(0);
    expect(result.submissionRate).toBe(100.0);
    expect(result.unsubmittedMembers).toEqual([]);
    expect(typeof result.aggregatedAt).toBe('string');
  });
});