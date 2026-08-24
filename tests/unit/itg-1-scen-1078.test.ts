import { aggregateReportSubmissionStatus, type AggregateReportSubmissionStatusInput, type ReportSubmissionStatusSummary } from '../../src/logic/submission-status-tracking';

describe('部長向けダッシュボードに本日の報告提出状況（提出済み・未提出）をリアルタイム表示し、未提出メンバーを一目で把握できる機能', () => {
  // SCEN-1078
  test('アクセスユーザー権限が部長以外のとき、リアルタイム表示がエラーになる', () => {
    const input: AggregateReportSubmissionStatusInput = {
      teamId: 'team-001',
      reportDate: '2024-01-15',
      requestUserId: 'user-engineer-001',
      includeDelayedSubmissions: true,
    };

    expect(() => aggregateReportSubmissionStatus(input)).toThrow(/権限/);
  });
});