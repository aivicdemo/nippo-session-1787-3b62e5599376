import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';

describe('部長向けダッシュボード提出状況リアルタイム表示機能', () => {
  // SCEN-099
  test('対象チームIDが空文字列のとき、エラーが発生する', () => {
    const input = {
      teamId: '',
      reportDate: '2024-01-15',
      requestUserId: 'user-001',
    };

    expect(() => aggregateReportSubmissionStatus(input)).toThrow(/チームID/);
  });
});