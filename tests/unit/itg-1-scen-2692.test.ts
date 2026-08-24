import { fetchYesterdayReport } from '../../src/logic/report-submission';

describe('朝会報告管理システム - 前日報告内容取得機能', () => {
  // SCEN-2692: [error] 前日報告内容取得機能 - 報告内容（今日やること）が空文字のとき、エラーが発生する
  test('should throw error when todayPlan is empty string', async () => {
    const engineerId = 'user-001';
    const targetDate = new Date('2024-01-15');
    const requestingUserId = 'manager-001';

    const yesterdayAccomplishment = 'A機能の実装完了';
    const todayPlan = '';
    const currentChallenges = 'B機能の仕様確認待ち';

    const input = {
      engineerId,
      targetDate,
      requestingUserId,
    };

    expect(() =>
      fetchYesterdayReport(
        input,
        {
          yesterdayAccomplishment,
          todayPlan,
          currentChallenges,
        }
      )
    ).toThrow(/今日やること/);
  });
});