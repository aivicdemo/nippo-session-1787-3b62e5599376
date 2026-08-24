import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';

describe('部長向けダッシュボードに本日の報告提出状況をリアルタイム表示', () => {
  // SCEN-417
  test('部長ユーザーIDが null のとき処理が中断されエラーを返す', () => {
    const input = {
      teamId: 'team-001',
      reportDate: '2024-01-15',
      requestUserId: null as any,
      includeDelayedSubmissions: true,
    };

    expect(() => aggregateReportSubmissionStatus(input)).toThrow(/requestUserId/);
  });
});