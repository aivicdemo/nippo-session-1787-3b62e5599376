import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム - 日報送信機能', () => {
  // SCEN-2212
  test('今日やることが2000文字を超える場合、入力検証エラーが返される', () => {
    const userId = 'eng-001';
    const teamId = 'team-dev-01';
    const reportDate = '2024-01-15';
    const yesterdayAccomplishment = 'テスト対象外のため最小限のテキスト';
    const todayPlanExceedsLimit = 'a'.repeat(2001);
    const challenges = 'テスト対象外のため最小限のテキスト';

    const input = {
      userId,
      teamId,
      yesterdayAccomplishment,
      todayPlan: todayPlanExceedsLimit,
      challenges,
      reportDate,
    };

    expect(() => submitDailyReport(input)).toThrow(/文字数/);
  });
});