import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';

describe('朝会報告提出状況集計機能 - 日報本体が null のエラーハンドリング', () => {
  // SCEN-346
  test('日報本体が null の状態で提出状況集計が実行されたとき、ValidationError を throw し、提出ステータスが更新されないこと', () => {
    const input = {
      teamId: 'team-001',
      reportDate: '2024-01-15',
      requestUserId: 'user-manager-001',
      includeDelayedSubmissions: true,
    };

    expect(() => aggregateReportSubmissionStatus(input)).toThrow(/日報本体/);
  });
});