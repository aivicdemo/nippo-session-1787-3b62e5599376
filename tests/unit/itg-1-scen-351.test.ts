import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';

describe('Report Submission Status Tracking - Real-time Update', () => {
  // SCEN-351
  test('should reject invalid datetime format in submission timestamp and prevent status update', () => {
    const invalidDatetimeFormats = [
      '2026-13-45T99:99:99.999Z',
      'invalid-datetime',
      '2026-01-15',
      '2026-01-15T25:00:00.000Z',
      'not-a-timestamp',
    ];

    const baseInput = {
      teamId: 'team-001',
      reportDate: '2026-01-15',
      requestUserId: 'user-manager-001',
      includeDelayedSubmissions: true,
    };

    for (const invalidFormat of invalidDatetimeFormats) {
      const inputWithInvalidTimestamp = {
        ...baseInput,
        submissionTimestamp: invalidFormat as any,
      };

      expect(() => {
        aggregateReportSubmissionStatus(inputWithInvalidTimestamp);
      }).toThrow(/datetime|format|timestamp/i);
    }
  });
});