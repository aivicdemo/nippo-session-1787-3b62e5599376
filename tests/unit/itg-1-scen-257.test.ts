import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('報告送信時刻の遅延判定機能', () => {
  // SCEN-257
  test('報告送信時刻が不正な日時形式のとき、エラーが発生して処理が進まない', () => {
    const invalidSubmissionTimestamp = '2024-13-45';
    const validUserId = 'user-001';
    const validTeamId = 'team-001';
    const validReportId = 'report-001';
    const validYesterdayAccomplishment = '昨日は機能Aの実装を完了しました';
    const validTodayPlan = '本日は機能Bの仕様確認を実施します';
    const validChallenges = '課題Cについて対応が必要です';

    const input = {
      reportId: validReportId,
      userId: validUserId,
      submissionTimestamp: new Date(invalidSubmissionTimestamp),
      reportContent: {
        yesterdayAccomplishment: validYesterdayAccomplishment,
        todayPlan: validTodayPlan,
        challenges: validChallenges,
      },
    };

    expect(() => submitDailyReport(input)).toThrow(/日時形式/);
  });
});