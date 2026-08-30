import { submitReport } from '../../src/logic/report-submission-management';

describe('朝会報告管理システム', () => {
  // SCEN-040
  test('エンジニアが日報を送信する際、yesterdayAccomplishmentが1000文字を超える場合、CharacterLimitExceededErrorが発生する', () => {
    const yesterdayAccomplishment = 'a'.repeat(1001);
    const todayPlan = '計画';
    const issuesAndConcerns = '課題';
    const reporterId = 'ENG001';
    const teamId = 'TEAM-A';
    const reportDate = new Date('2024-01-15T09:00:00Z');

    const submitReportInput = {
      reporterId,
      teamId,
      reportDate,
      yesterdayAccomplishment,
      todayPlan,
      issuesAndConcerns,
    };

    expect(() => submitReport(submitReportInput)).toThrow(/文字数上限/);
  });
});