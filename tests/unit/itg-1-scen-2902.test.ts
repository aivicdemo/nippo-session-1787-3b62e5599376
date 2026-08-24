import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';
import { type AggregateReportSubmissionStatusInput } from '../../src/logic/submission-status-tracking';

describe('Report Submission Status Aggregation', () => {
  // SCEN-2902: [error] 提出状況表示機能 - チームIDが空のとき提出状況集計がエラーになる
  test('should throw validation error when teamId is empty string', () => {
    const input: AggregateReportSubmissionStatusInput = {
      teamId: '',
      reportDate: '2024-01-15',
      requestUserId: 'user-001',
      includeDelayedSubmissions: true,
    };

    expect(() => aggregateReportSubmissionStatus(input)).toThrow(/チームID/);
  });
});