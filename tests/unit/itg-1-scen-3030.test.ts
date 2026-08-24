import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';

describe('本日の報告提出状況リアルタイム表示機能', () => {
  // SCEN-3030
  test('チームIDが空文字列のとき、提出状況の集計処理がエラーになる', () => {
    const input = {
      teamId: '',
      reportDate: '2024-01-15',
      requestUserId: 'user-001',
      includeDelayedSubmissions: true,
    };

    expect(() => aggregateReportSubmissionStatus(input)).toThrow(/teamId|チームID/);
  });
});