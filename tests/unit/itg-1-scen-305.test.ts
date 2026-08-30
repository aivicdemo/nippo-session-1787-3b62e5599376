import { submitReport } from '../../src/logic/report-submission-management';

describe('朝会報告管理システム - 日報送信管理', () => {
  // SCEN-305: [error] エンジニアが日報を送信し、入力検証、送信時刻記録、期限判定、提出状況更新を実行する - データベースへの保存に失敗したときという明示された境界条件で日報の送信に失敗しました。もう一度お試しください
  test('submitReport関数を呼び出す際にsaveReport関数がデータベース保存に失敗すると、日報の送信に失敗したというエラーメッセージを含むエラーが発生する', () => {
    const reporterId = 'ENG001';
    const teamId = 'TEAM-A';
    const reportDate = new Date('2024-01-15T00:00:00Z');
    const yesterdayAccomplishment = '昨日の成果';
    const todayPlan = '今日の予定';
    const issuesAndConcerns = '課題内容';

    expect(() => {
      submitReport({
        reporterId,
        teamId,
        reportDate,
        yesterdayAccomplishment,
        todayPlan,
        issuesAndConcerns,
      });
    }).toThrow(/日報の送信に失敗/);
  });
});