import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';

describe('朝会報告管理システム - 部長ダッシュボード提出状況色分け表示', () => {
  // SCEN-111: [error] 部長ダッシュボード提出状況リアルタイム表示機能 - 色分け設定マスタが空のとき、エラーが発生する
  test('色分け設定マスタが空の状態で、aggregateReportSubmissionStatus呼び出しが色分け設定不足エラーを発生させる', () => {
    const input = {
      teamId: 'team-001',
      reportDate: '2024-01-15',
      requestUserId: 'user-manager-001',
      includeDelayedSubmissions: true,
    };

    expect(() => aggregateReportSubmissionStatus(input)).toThrow(/色分け設定/);
  });
});