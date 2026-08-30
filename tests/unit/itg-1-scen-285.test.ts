import { submitReport } from '../../src/logic/report-submission-management';

describe('朝会報告管理システム', () => {
  // SCEN-285
  test('エンジニアが日報を送信し、報告期限時刻が HH:mm 形式でない場合はエラーをスローする', () => {
    const reporterId = '5001';
    const teamId = 'TEAM-A';
    const reportDate = new Date('2024-01-15T00:00:00Z');
    const yesterdayAccomplishment = '昨日の実績';
    const todayPlan = '今日の予定';
    const issuesAndConcerns = '課題内容';
    const reportDeadlineTime = 'invalid-format';

    expect(() => {
      submitReport(
        {
          reporterId,
          teamId,
          reportDate,
          yesterdayAccomplishment,
          todayPlan,
          issuesAndConcerns,
        },
        {
          reportSubmissionDeadline: new Date('2024-01-15T09:30:00Z'),
          characterLimitPerField: 1000,
          minimumCharacterPerField: 1,
        },
        reportDeadlineTime
      );
    }).toThrow(/HH:mm/);
  });
});