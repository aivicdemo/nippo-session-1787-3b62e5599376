import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';

describe('課題の優先度を色分けで表示するダッシュボード機能', () => {
  // SCEN-3037: [error] 本日の報告提出状況リアルタイム表示機能 - 色分け設定情報が null のとき、ダッシュボード表示用の色コードを決定できずエラーになる
  test('色分け設定情報がnullの場合、色コード決定処理でエラーをスロー', () => {
    const input = {
      teamId: 'team-001',
      reportDate: '2024-01-15',
      requestUserId: 'user-001',
      includeDelayedSubmissions: true,
      colorConfiguration: null,
    };

    expect(() => {
      aggregateReportSubmissionStatus(input);
    }).toThrow(/色分け設定|color|configuration|null/i);
  });
});