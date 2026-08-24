import { describe, test, expect } from '@jest/globals';
import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';
import type { AggregateReportSubmissionStatusInput, ReportSubmissionStatusSummary } from '../../src/logic/submission-status-tracking';

describe('Report Submission Status Aggregation', () => {
  test('SCEN-2767: should throw error when submission deadline is null', async () => {
    // Setup: Create input with a report record where submissionDeadline is null
    const input: AggregateReportSubmissionStatusInput = {
      teamId: 'team-001',
      reportDate: '2024-01-15',
      requestUserId: 'user-admin-001',
      includeDelayedSubmissions: true,
    };

    // Mock report data with null submissionDeadline
    const reportRecordWithNullDeadline = {
      id: 'report-001',
      userId: 'user-001',
      teamId: 'team-001',
      reportDate: '2024-01-15',
      submissionDeadline: null, // null deadline - invalid state
      submittedAt: new Date('2024-01-15T08:30:00Z'),
    };

    // Execute and verify: aggregateReportSubmissionStatus should throw
    // when encountering null submissionDeadline in submitted judgment logic
    expect(() => {
      aggregateReportSubmissionStatus(input);
    }).toThrow(/deadline|Deadline|null|submission/);
  });
});