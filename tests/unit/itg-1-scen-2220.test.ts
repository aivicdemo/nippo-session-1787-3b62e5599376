import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('朝会報告の入力値検証機能', () => {
  // SCEN-2220: 報告項目テキストが最大許容文字数を1文字超過し検証に不合格となる
  test('should reject submission when challenges field exceeds maximum character limit by 1', () => {
    const userId = 'user-001';
    const teamId = 'team-001';
    const reportDate = '2024-01-15';
    const yesterdayAccomplishment = 'テスト実施完了';
    const todayPlan = '機能開発実施';

    // challenges の最大許容文字数は 2000 文字（SubmitDailyReportInput の仕様から）
    // 最大許容文字数を1文字超過するテキストを作成
    const challengesExceeded = 'a'.repeat(2001);

    const input = {
      userId,
      teamId,
      yesterdayAccomplishment,
      todayPlan,
      challenges: challengesExceeded,
      reportDate,
    };

    expect(() => submitDailyReport(input)).toThrow(/文字数/);
  });
});