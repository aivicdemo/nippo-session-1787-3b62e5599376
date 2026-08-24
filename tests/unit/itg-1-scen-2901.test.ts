import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';
import type { AggregateReportSubmissionStatusInput, ReportSubmissionStatusSummary } from '../../src/logic/submission-status-tracking';

describe('部長向けダッシュボード - 報告提出状況リアルタイム表示', () => {
  // SCEN-2901: [error] 提出状況表示機能 - 対象日時が未設定のとき提出状況が確定されない
  test('対象日が未設定の場合、提出状況の確定フラグが未確定となり集計値が表示されない', () => {
    const input: AggregateReportSubmissionStatusInput = {
      teamId: 'team-001',
      reportDate: '', // 対象日時が未設定
      requestUserId: 'user-manager-001',
      includeDelayedSubmissions: true,
    };

    expect(() => aggregateReportSubmissionStatus(input)).toThrow(/reportDate|日付/i);
  });
});