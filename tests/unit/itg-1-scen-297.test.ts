import { submitReport } from '../../src/logic/report-submission-management';

describe('朝会報告管理システム', () => {
  // SCEN-297
  test('エンジニアが昨日やったことに501文字を入力して送信したときValidationErrorが発生し「昨日やったことは500文字以内で入力してください」を含む', () => {
    const yesterdayText501Chars = 'a'.repeat(501);
    const validTodayPlan = 'valid today plan';
    const validIssues = 'valid issues and concerns';
    const reportDate = new Date('2024-01-15');
    const reporterId = 'user123';
    const teamId = 'team-A';

    expect(() =>
      submitReport({
        reporterId,
        teamId,
        reportDate,
        yesterdayAccomplishment: yesterdayText501Chars,
        todayPlan: validTodayPlan,
        issuesAndConcerns: validIssues,
      })
    ).toThrow(/昨日やったことは500文字以内で入力してください/);
  });
});