import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';

describe('提出状況集計機能', () => {
  // SCEN-2905
  test('提出データが空のとき確定処理がエラーになる', () => {
    const input = {
      teamId: 'team-001',
      reportDate: '2024-01-15',
      requestUserId: 'manager-001',
      includeDelayedSubmissions: true,
    };

    expect(() => {
      aggregateReportSubmissionStatus(input);
    }).toThrow(/提出データ/);
  });
});