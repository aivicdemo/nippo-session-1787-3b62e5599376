import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';
import { type AggregateReportSubmissionStatusInput, type ReportSubmissionStatusSummary } from '../../src/logic/submission-status-tracking';

describe('Report Submission Status Tracking', () => {
  test('SCEN-349: aggregateReportSubmissionStatus throws validation error when teamId is empty string', () => {
    // Arrange
    const input: AggregateReportSubmissionStatusInput = {
      teamId: '',
      reportDate: '2024-01-15',
      requestUserId: 'user-001',
      includeDelayedSubmissions: true,
    };

    // Act & Assert
    expect(() => aggregateReportSubmissionStatus(input)).toThrow(/teamId/);
  });
});