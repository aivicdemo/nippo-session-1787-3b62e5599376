import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';

describe('部長向けダッシュボード - 本日の報告提出状況リアルタイム表示', () => {
  // SCEN-355: [error] 日報送信時の提出状況リアルタイム更新機能 - 指定されたチーム ID がシステムに存在しないとき、提出状況更新処理がエラーとなる
  test('should throw error when team ID does not exist in system', async () => {
    const input = {
      teamId: 'TEAM-INVALID-999',
      reportDate: '2024-01-15',
      requestUserId: 'user-001',
      includeDelayedSubmissions: true,
    };

    expect(() => aggregateReportSubmissionStatus(input)).toThrow(/チームID/);
  });
});