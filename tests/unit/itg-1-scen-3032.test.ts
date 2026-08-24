import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';
import type { AggregateReportSubmissionStatusInput, ReportSubmissionStatusSummary } from '../../src/logic/submission-status-tracking';

describe('報告提出状況集計機能', () => {
  // SCEN-3032
  test('照会対象日付が不正な日付形式のとき、日付パース処理がエラーになる', () => {
    const invalidInput: AggregateReportSubmissionStatusInput = {
      teamId: 'team-001',
      reportDate: '2024-13-45',
      requestUserId: 'user-manager-001',
      includeDelayedSubmissions: true,
    };

    expect(() => aggregateReportSubmissionStatus(invalidInput)).toThrow(/日付形式/);
  });
});