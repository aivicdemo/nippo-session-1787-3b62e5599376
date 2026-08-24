import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';
import type {
  AggregateReportSubmissionStatusInput,
  ReportSubmissionStatusSummary,
  UnsubmittedMember,
} from '../../src/logic/submission-status-tracking';

describe('Report Submission Status Aggregation', () => {
  test('SCEN-350: aggregateReportSubmissionStatus throws error when submittedAt is null', () => {
    // Arrange: Build input with null submittedAt to trigger the error condition
    const input: AggregateReportSubmissionStatusInput = {
      teamId: 'team-001',
      reportDate: '2024-01-15',
      requestUserId: 'user-manager-001',
      includeDelayedSubmissions: true,
    };

    // Act & Assert: Call the function and verify it throws the expected error
    expect(() => aggregateReportSubmissionStatus(input)).toThrow(/submittedAt/);
  });
});