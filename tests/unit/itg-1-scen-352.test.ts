import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';

describe('部長向けダッシュボードの報告提出状況リアルタイム表示', () => {
  // SCEN-352
  test('チーム ID が null のとき、提出状況集計処理がエラーとなる', () => {
    const input = {
      teamId: null as any,
      reportDate: '2024-01-15',
      requestUserId: 'user-manager-001',
      includeDelayedSubmissions: true,
    };

    expect(() => aggregateReportSubmissionStatus(input)).toThrow(/teamId/);
  });
});