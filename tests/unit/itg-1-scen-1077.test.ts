import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';

describe('報告提出状況リアルタイム表示機能', () => {
  test('SCEN-1077: チーム ID が空文字列のとき、提出状況照会がエラーになる', () => {
    const input = {
      teamId: '',
      reportDate: '2024-01-15',
      requestUserId: 'user-001',
      includeDelayedSubmissions: true,
    };

    expect(() => aggregateReportSubmissionStatus(input)).toThrow(/チームID/);
  });
});