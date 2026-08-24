import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';

describe('報告提出状況リアルタイム集計機能', () => {
  // SCEN-411
  test('対象日付が null のとき処理が中断されエラーを返す', () => {
    const input = {
      teamId: 'team-001',
      reportDate: null as any,
      requestUserId: 'user-001',
      includeDelayedSubmissions: true,
    };

    expect(() => aggregateReportSubmissionStatus(input)).toThrow(/対象日付/);
  });
});