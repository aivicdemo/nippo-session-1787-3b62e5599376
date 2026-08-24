import { describe, test, expect } from '@jest/globals';
import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';

describe('Report Submission Status Aggregation with Null Deadline', () => {
  test('SCEN-100: aggregateReportSubmissionStatus throws error when submission deadline time is null', () => {
    const input = {
      teamId: 'team-001',
      reportDate: '2024-01-15',
      requestUserId: 'manager-001',
      includeDelayedSubmissions: true,
    };

    const nullDeadlineConfig = {
      reportDate: new Date('2024-01-15'),
      deadlineTime: null as unknown as string,
      timeZone: 'Asia/Tokyo',
    };

    expect(() => {
      aggregateReportSubmissionStatus(input, nullDeadlineConfig);
    }).toThrow(/提出期限/);
  });
});