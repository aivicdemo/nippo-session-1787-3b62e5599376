import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';

describe('部長向けダッシュボード提出状況リアルタイム表示', () => {
  // SCEN-353
  test('チームIDが空文字列のとき、提出状況更新処理がエラーとなる', () => {
    const input = {
      teamId: '',
      reportDate: '2024-01-15',
      requestUserId: 'user-001',
      includeDelayedSubmissions: true,
    };

    expect(() => aggregateReportSubmissionStatus(input)).toThrow(/チームID/);
  });
});