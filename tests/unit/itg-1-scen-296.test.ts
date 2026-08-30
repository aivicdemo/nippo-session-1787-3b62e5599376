import { submitReport } from '../../src/logic/report-submission-management';

describe('朝会報告管理システム', () => {
  // SCEN-296
  test('エンジニアが日報を送信し、昨日やったことが空白のときにエラーが発生する', () => {
    const reporterId = 'ENG001';
    const teamId = 'TEAM-A';
    const reportDate = new Date('2024-01-15T00:00:00Z');
    const yesterdayAccomplishment = '';
    const todayPlan = '本日はバグ修正を予定';
    const issuesAndConcerns = 'デプロイ環境の設定に課題あり';

    expect(() => {
      submitReport({
        reporterId,
        teamId,
        reportDate,
        yesterdayAccomplishment,
        todayPlan,
        issuesAndConcerns,
      });
    }).toThrow(/昨日やったこと/);
  });
});