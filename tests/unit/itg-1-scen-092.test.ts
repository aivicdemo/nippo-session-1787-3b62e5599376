import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';

describe('部長ダッシュボード提出状況リアルタイム表示機能', () => {
  // SCEN-092
  test('チームメンバーの報告データ一覧が null のとき、エラーが発生する', () => {
    const input = {
      teamId: 'team-001',
      reportDate: '2024-01-15',
      requestUserId: 'manager-001',
      includeDelayedSubmissions: true,
    };

    expect(() => {
      aggregateReportSubmissionStatus(input, null);
    }).toThrow(/チームメンバーの報告データ/);
  });
});