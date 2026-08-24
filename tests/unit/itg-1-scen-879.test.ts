import { describe, test, expect } from '@jest/globals';
import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';
import type { AggregateReportSubmissionStatusInput } from '../../src/logic/submission-status-tracking';

describe('報告提出状況リアルタイム表示機能', () => {
  // SCEN-879
  test('チームIDが0で渡されたときエラーになる', () => {
    const input: AggregateReportSubmissionStatusInput = {
      teamId: '0',
      reportDate: '2024-01-15',
      requestUserId: 'user-001',
      includeDelayedSubmissions: true,
    };

    expect(() => aggregateReportSubmissionStatus(input)).toThrow(/チームID/);
  });
});