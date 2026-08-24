import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';

describe('部長向けダッシュボード提出状況リアルタイム表示機能', () => {
  // SCEN-098
  test('対象チーム ID が null のとき、チーム特定に失敗しエラーになる', () => {
    const input = {
      teamId: null as unknown as string,
      reportDate: '2024-01-15',
      requestUserId: 'user-001',
      includeDelayedSubmissions: true,
    };

    expect(() => {
      aggregateReportSubmissionStatus(input);
    }).toThrow(/チーム/);
  });
});