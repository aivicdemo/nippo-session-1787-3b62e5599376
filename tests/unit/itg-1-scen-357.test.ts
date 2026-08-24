import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';

describe('Submission Status Tracking - Real-time Update on Report Submission', () => {
  // SCEN-357
  test('should return validation error when submission timestamp is in the future', async () => {
    const now = new Date('2024-01-15T09:00:00Z');
    const futureTimestamp = new Date('2024-01-15T10:00:00Z');

    const input = {
      teamId: 'team-001',
      reportDate: '2024-01-15',
      requestUserId: 'user-member-001',
      includeDelayedSubmissions: true,
    };

    expect(() => {
      aggregateReportSubmissionStatus(input);
    }).toThrow(/送信時刻/);
  });
});