import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';
import type { AggregateReportSubmissionStatusInput, ReportSubmissionStatusSummary } from '../../src/logic/submission-status-tracking';

describe('報告提出状況リアルタイム集計機能', () => {
  // SCEN-410
  test('チームIDが空文字列のとき処理が中断されエラーを返す', () => {
    const input: AggregateReportSubmissionStatusInput = {
      teamId: '',
      reportDate: '2024-01-15',
      requestUserId: 'user-001',
      includeDelayedSubmissions: true,
    };

    expect(() => aggregateReportSubmissionStatus(input)).toThrow(/チームID/);
  });
});