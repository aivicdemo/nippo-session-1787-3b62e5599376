import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';

describe('優先度の高い課題を部長向けダッシュボードで強調表示する機能', () => {
  // SCEN-110
  test('色分け設定マスタが null のとき、強調表示ロジックでエラーになる', () => {
    const input = {
      teamId: 'team-001',
      reportDate: '2024-01-15',
      requestUserId: 'manager-001',
      includeDelayedSubmissions: true,
    };

    expect(() => aggregateReportSubmissionStatus(input)).toThrow(/null/i);
  });
});