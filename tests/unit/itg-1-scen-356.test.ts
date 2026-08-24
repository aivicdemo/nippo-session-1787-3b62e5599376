import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';
import type { AggregateReportSubmissionStatusInput, ReportSubmissionStatusSummary } from '../../src/logic/submission-status-tracking';

describe('report submission status aggregation - authorization', () => {
  // SCEN-356
  test('should return authorization error when user does not belong to the specified team', async () => {
    const input: AggregateReportSubmissionStatusInput = {
      teamId: 'team_sales',
      reportDate: '2024-01-15',
      requestUserId: 'user_001',
      includeDelayedSubmissions: true,
    };

    expect(() => aggregateReportSubmissionStatus(input)).toThrow(/チーム/);
  });
});