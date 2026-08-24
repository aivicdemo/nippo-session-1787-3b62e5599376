import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';
import { type AggregateReportSubmissionStatusInput, type ReportSubmissionStatusSummary } from '../../src/logic/submission-status-tracking';

describe('本日の報告提出状況リアルタイム表示機能', () => {
  // SCEN-3043
  test('朝7時30分の定時取得に失敗しnullが返されたとき、エラーハンドリングが動作する', () => {
    const input: AggregateReportSubmissionStatusInput = {
      teamId: 'team-001',
      reportDate: '2024-01-15',
      requestUserId: 'user-manager-001',
      includeDelayedSubmissions: true,
    };

    expect(() => aggregateReportSubmissionStatus(input)).toThrow(/定時取得|null/);
  });
});