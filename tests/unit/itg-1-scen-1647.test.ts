import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';

describe('報告提出状況リアルタイム表示機能', () => {
  // SCEN-1647
  test('本日の日付が未指定のまま提出状況集計を実行しようとしたとき、処理を中止しエラーを返す', () => {
    const input = {
      teamId: 'team-001',
      reportDate: '',
      requestUserId: 'user-manager-001',
      includeDelayedSubmissions: true,
    };

    expect(() => aggregateReportSubmissionStatus(input)).toThrow(/reportDate/);
  });
});