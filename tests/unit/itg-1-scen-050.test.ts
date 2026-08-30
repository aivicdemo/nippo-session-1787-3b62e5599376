import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { recordSubmissionTimestamp } from '../../src/logic/report-submission-management';
import type { RecordSubmissionTimestampInput } from '../../src/logic/report-submission-management';

describe('Report Submission Timestamp Recording', () => {
  // SCEN-050: Error when report submission deadline is not configured in the system
  test('should throw DeadlineNotConfiguredError when report submission deadline is not set', () => {
    // Setup: Create input with valid report ID and timestamps
    const input: RecordSubmissionTimestampInput = {
      reportId: 'RPT-001',
      submissionTimestamp: new Date('2024-01-15T09:30:00Z'),
      reportDate: new Date('2024-01-15'),
      submitterId: 'USER-001'
    };

    // Execute and verify that the function throws the expected error
    expect(() => recordSubmissionTimestamp(input)).toThrow(/報告期限の設定が見つかりません/);
  });
});