import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム', () => {
  // SCEN-2528: [error] 初回テスト報告の入力検証 - 課題発見フラグが偽だが課題内容が入力されている矛盾した入力のとき入力検証エラーが返される
  test('課題フラグが偽で課題内容が存在する場合、入力検証エラーを返す', () => {
    const input = {
      userId: 'test-user-001',
      teamId: 'team-001',
      yesterdayAccomplishment: 'タスクA完了',
      todayPlan: 'タスクB開始',
      challenges: 'データベース接続エラーが発生',
      reportDate: '2024-01-15',
      hasChallenges: false,
    };

    expect(() => submitDailyReport(input)).toThrow(/矛盾した入力|課題なし/);
  });
});