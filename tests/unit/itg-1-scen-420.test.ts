import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';
import { type AggregateReportSubmissionStatusInput, type ReportSubmissionStatusSummary } from '../../src/logic/submission-status-tracking';

describe('報告提出状況リアルタイム集計機能', () => {
  // SCEN-420
  test('チームIDが存在しないとき処理が中断されエラーを返す', () => {
    const invalidInput: AggregateReportSubmissionStatusInput = {
      teamId: 'TEAM-99999',
      reportDate: '2024-01-15',
      requestUserId: 'user-001',
      includeDelayedSubmissions: true,
    };

    expect(() => aggregateReportSubmissionStatus(invalidInput)).toThrow(/チームID/);
  });
});