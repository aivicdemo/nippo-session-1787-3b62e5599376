import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';
import type { AggregateReportSubmissionStatusInput, ReportSubmissionStatusSummary } from '../../src/logic/submission-status-tracking';

describe('aggregateReportSubmissionStatus', () => {
  // SCEN-1028
  test('should display zero unsubmitted members when all team members have submitted their reports on time', () => {
    const input: AggregateReportSubmissionStatusInput = {
      teamId: 'team-001',
      reportDate: '2024-01-15',
      requestUserId: 'user-manager-001',
      includeDelayedSubmissions: true,
    };

    const totalMembers = 10;
    const submittedCount = 10;
    const unsubmittedCount = 0;
    const delayedSubmissionCount = 0;
    const submissionRate = 100.0;

    const result: ReportSubmissionStatusSummary = aggregateReportSubmissionStatus(input);

    expect(result.teamId).toBe('team-001');
    expect(result.reportDate).toBe('2024-01-15');
    expect(result.totalMembers).toBe(totalMembers);
    expect(result.submittedCount).toBe(submittedCount);
    expect(result.unsubmittedCount).toBe(unsubmittedCount);
    expect(result.delayedSubmissionCount).toBe(delayedSubmissionCount);
    expect(result.submissionRate).toBe(submissionRate);
    expect(result.unsubmittedMembers).toEqual([]);
    expect(typeof result.aggregatedAt).toBe('string');
  });
});