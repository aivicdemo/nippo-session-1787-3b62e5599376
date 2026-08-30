import { submitReport } from '../../src/logic/report-submission-management';

describe('朝会報告管理システム - 日報送信機能', () => {
  // SCEN-192: [error] エンジニアが日報を送信し、入力検証で昨日の実績が空文字列のとき例外が発生する
  test('yesterdayAccomplishment が空文字列の場合、ValidationError を throw する', () => {
    const submitReportInput = {
      reporterId: 'ENG001',
      teamId: 'TEAM-A',
      reportDate: new Date('2024-01-15'),
      yesterdayAccomplishment: '',
      todayPlan: '本日の予定テキスト',
      issuesAndConcerns: '課題テキスト',
    };

    expect(() => submitReport(submitReportInput)).toThrow(/3つの項目すべてを入力してください/);
  });
});