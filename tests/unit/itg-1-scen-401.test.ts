import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';
import type { 
  AggregateReportSubmissionStatusInput,
  ReportSubmissionStatusSummary
} from '../../src/logic/submission-status-tracking';

describe('Report submission status aggregation', () => {
  // SCEN-401
  test('aggregates report submission status idempotently - same input produces identical results on repeated calls', () => {
    const testInput: AggregateReportSubmissionStatusInput = {
      teamId: 'team-001',
      reportDate: '2024-01-15',
      requestUserId: 'user-manager-001',
      includeDelayedSubmissions: true
    };

    const firstResult: ReportSubmissionStatusSummary = aggregateReportSubmissionStatus(testInput);
    const secondResult: ReportSubmissionStatusSummary = aggregateReportSubmissionStatus(testInput);

    expect(firstResult.teamId).toBe('team-001');
    expect(firstResult.reportDate).toBe('2024-01-15');
    expect(firstResult.totalMembers).toBe(10);
    expect(firstResult.submittedCount).toBe(8);
    expect(firstResult.unsubmittedCount).toBe(2);
    expect(firstResult.delayedSubmissionCount).toBe(0);
    expect(firstResult.submissionRate).toBe(80.0);

    expect(secondResult.teamId).toBe(firstResult.teamId);
    expect(secondResult.reportDate).toBe(firstResult.reportDate);
    expect(secondResult.totalMembers).toBe(firstResult.totalMembers);
    expect(secondResult.submittedCount).toBe(firstResult.submittedCount);
    expect(secondResult.unsubmittedCount).toBe(firstResult.unsubmittedCount);
    expect(secondResult.delayedSubmissionCount).toBe(firstResult.delayedSubmissionCount);
    expect(secondResult.submissionRate).toBe(firstResult.submissionRate);

    expect(firstResult.unsubmittedMembers).toEqual(secondResult.unsubmittedMembers);
    expect(firstResult.aggregatedAt).toBe(secondResult.aggregatedAt);
  });
});