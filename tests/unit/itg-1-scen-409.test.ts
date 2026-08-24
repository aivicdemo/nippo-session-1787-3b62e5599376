import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';

describe('部長向けダッシュボードにリアルタイム報告提出状況を表示する機能', () => {
  // SCEN-409
  test('チームIDがnullのとき、処理が中断されエラーを返す', () => {
    const input = {
      teamId: null as any,
      reportDate: '2024-01-15',
      requestUserId: 'user-001',
      includeDelayedSubmissions: true,
    };

    expect(() => aggregateReportSubmissionStatus(input)).toThrow(/チームID/);
  });
});