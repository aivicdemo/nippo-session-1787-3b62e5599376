import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';

describe('Report Submission Status Aggregation - Team Members Null Validation', () => {
  // SCEN-1648
  test('should throw error when team members list is null during submission status aggregation', () => {
    const reportDate = '2024-01-15';
    const requestUserId = 'user-admin-001';

    const input = {
      teamId: 'team-dev-001',
      reportDate: reportDate,
      requestUserId: requestUserId,
      includeDelayedSubmissions: true,
    };

    expect(() => aggregateReportSubmissionStatus(input, null)).toThrow(/teamMembers|Team members|null/i);
  });
});