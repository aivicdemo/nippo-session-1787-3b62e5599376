import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';
import type { AggregateReportSubmissionStatusInput, ReportSubmissionStatusSummary } from '../../src/logic/submission-status-tracking';

describe('aggregateReportSubmissionStatus', () => {
  // SCEN-354
  test('should return error when requestUserId does not exist in system', async () => {
    const input: AggregateReportSubmissionStatusInput = {
      teamId: 'TEAM_001',
      reportDate: '2024-01-15',
      requestUserId: 'USER_NONEXISTENT_99999',
      includeDelayedSubmissions: true,
    };

    expect(() => aggregateReportSubmissionStatus(input)).toThrow(/ユーザーID/);
  });
});