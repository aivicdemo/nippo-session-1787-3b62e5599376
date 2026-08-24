import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';

describe('提出状況集計機能', () => {
  test('SCEN-2904: 朝会開始時刻が空のとき提出状況集計でバリデーションエラーを発生させる', () => {
    // Arrange: 朝会開始時刻が空の設定でテスト入力を準備
    const input = {
      teamId: 'team-001',
      reportDate: '2024-01-15',
      requestUserId: 'manager-001',
      includeDelayedSubmissions: true,
    };

    // 朝会開始時刻が空（未設定）の状態をシミュレート
    // システムが朝会開始時刻を検証してエラーを発生させるべき
    // このテストでは、提出状況集計処理が朝会開始時刻の必須チェックを行い、
    // 空の場合に適切なエラーを投げることを検証する

    // Act & Assert: 朝会開始時刻が設定されていない状態で関数を呼び出し、エラーを期待
    expect(() => {
      aggregateReportSubmissionStatus(input);
    }).toThrow(/朝会開始時刻/);
  });
});