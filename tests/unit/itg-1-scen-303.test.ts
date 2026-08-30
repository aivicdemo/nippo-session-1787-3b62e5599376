import { submitReport } from '../../src/logic/report-submission-management';
import type { SubmitReportInput } from '../../src/logic/report-submission-management';

describe('朝会報告管理システム', () => {
  // SCEN-303: [error] エンジニアが日報を送信し、入力検証、送信時刻記録、期限判定、提出状況更新を実行する - 日報の3項目（昨日やったこと、今日やること、抱えている課題）のいずれかが空のときという明示された境界条件ですべての項目を入力してください
  test('SCEN-303: submitReportで日報の昨日の実績が空のとき検証エラーが発生する', () => {
    const input: SubmitReportInput = {
      reporterId: 'ENG001',
      teamId: 'TEAM-A',
      reportDate: new Date('2024-01-15T00:00:00Z'),
      yesterdayAccomplishment: '',
      todayPlan: '本日の実装予定',
      issuesAndConcerns: '特になし',
    };

    expect(() => submitReport(input)).toThrow(/すべての項目を入力してください/);
  });
});