import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム - 日報送信', () => {
  // SCEN-2042: [error] 対策案・実行計画の必須項目検証 - 指定された承認権者がシステムに存在しないユーザーIDのとき検証エラーになる
  test('承認権者が存在しないユーザーIDの場合、検証エラーが返される', async () => {
    const nonExistentApproverId = 'user_9999';

    const submitInput = {
      userId: 'engineer_001',
      teamId: 'team_alpha',
      yesterdayAccomplishment: '昨日は機能Aの実装を完了した。',
      todayPlan: '今日は機能Bのテストを実施する予定。',
      challenges: '承認プロセスの自動化が課題。',
      reportDate: '2024-01-15',
      approverUserId: nonExistentApproverId,
    };

    const mockUserLookupService = {
      userExists: jest.fn().mockResolvedValue(false),
    };

    expect(
      () =>
        submitDailyReport(submitInput, mockUserLookupService)
    ).rejects.toThrow(/承認権者/);
  });
});