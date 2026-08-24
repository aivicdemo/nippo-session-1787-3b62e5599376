import { aggregateReportSubmissionStatus } from '../../src/logic/submission-status-tracking';

describe('報告提出状況リアルタイム表示機能', () => {
  test('SCEN-1081: 提出済みマークがあってもreportDataがnullの場合、データ整合性エラーを返す', () => {
    // テスト用入力データ
    const input = {
      teamId: 'team-001',
      reportDate: '2024-01-15',
      requestUserId: 'user-manager-001',
      includeDelayedSubmissions: true,
    };

    // データ整合性エラーの状態を再現するためのモック
    // submissionStatusが「提出済み」なのにreportDataがnullという矛盾状態
    const inconsistentReportRecord = {
      userId: 'user-a-001',
      submissionStatus: 'submitted' as const,
      reportData: null,
      teamId: 'team-001',
      reportDate: '2024-01-15',
    };

    // 関数を呼び出し、データ整合性エラーをキャッチすることを期待
    expect(() => {
      aggregateReportSubmissionStatus(input, {
        // テスト用のレポートレコード供給
        getReportRecords: async () => [inconsistentReportRecord],
        getTeamMembers: async () => [
          {
            userId: 'user-a-001',
            userName: 'ユーザーA',
            email: 'user-a@example.com',
            teamId: 'team-001',
          },
        ],
      });
    }).toThrow(/データ整合性/);
  });
});