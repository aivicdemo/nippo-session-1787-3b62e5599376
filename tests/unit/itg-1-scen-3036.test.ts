import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';

describe('本日の報告提出状況リアルタイム表示機能', () => {
  // SCEN-3036
  test('提出期限が null のとき、未提出メンバーの判定ロジックが失敗してエラーになる', () => {
    const input = {
      teamId: 'team-001',
      reportDate: '2024-01-15',
      requestUserId: 'user-001',
      includeDelayedSubmissions: true,
    };

    expect(() => aggregateReportSubmissionStatus(input)).toThrow(/提出期限/);
  });
});