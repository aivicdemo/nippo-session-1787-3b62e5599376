import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';
import { type AggregateReportSubmissionStatusInput, type ReportSubmissionStatusSummary } from '../../src/logic/submission-status-tracking';

describe('部長ダッシュボード提出状況リアルタイム表示機能', () => {
  // SCEN-096
  test('部長のユーザーIDが null のとき、権限検証でエラーになる', () => {
    const invalidInput: AggregateReportSubmissionStatusInput = {
      teamId: 'team-001',
      reportDate: '2024-01-15',
      requestUserId: null as unknown as string,
      includeDelayedSubmissions: true,
    };

    expect(() => {
      aggregateReportSubmissionStatus(invalidInput);
    }).toThrow(/ユーザーID/);
  });
});