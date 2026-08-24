import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';
import { type AggregateReportSubmissionStatusInput, type ReportSubmissionStatusSummary } from '../../src/logic/submission-status-tracking';

describe('報告提出状況リアルタイム表示機能', () => {
  // SCEN-2768
  test('チームメンバー一覧が空のとき未提出者一覧の算出が失敗する', () => {
    const input: AggregateReportSubmissionStatusInput = {
      teamId: 'team-001',
      reportDate: '2024-01-15',
      requestUserId: 'user-dept-head',
      includeDelayedSubmissions: true,
    };

    expect(() => {
      aggregateReportSubmissionStatus(input, []);
    }).toThrow(/チームメンバー一覧|空|メンバー情報/i);
  });
});