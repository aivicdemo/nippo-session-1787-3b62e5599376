import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';

describe('提出状況表示機能 - 権限検証', () => {
  test('SCEN-2903: 部長権限がないユーザーが提出状況を照会しようとするとき権限エラーが発生する', () => {
    const input = {
      teamId: 'team-001',
      reportDate: '2024-01-15',
      requestUserId: 'user-general-member-001',
      includeDelayedSubmissions: true,
    };

    expect(() => aggregateReportSubmissionStatus(input)).toThrow(/権限/);
  });
});