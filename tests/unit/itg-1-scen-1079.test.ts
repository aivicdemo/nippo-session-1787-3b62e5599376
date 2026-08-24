import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';

describe('報告提出状況リアルタイム表示機能', () => {
  // SCEN-1079
  test('チームメンバー一覧がnullのとき、提出状況マッピングがエラーになる', () => {
    const input = {
      teamId: 'team-001',
      reportDate: '2024-01-15',
      requestUserId: 'user-manager-001',
      includeDelayedSubmissions: true,
    };

    expect(() => aggregateReportSubmissionStatus(input)).toThrow(/チームメンバー/);
  });
});