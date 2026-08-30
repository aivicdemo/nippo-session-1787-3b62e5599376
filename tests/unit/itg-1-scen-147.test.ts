import { saveReport } from '../../src/logic/report-persistence';

describe('朝会報告管理システム - 日報永続化', () => {
  // SCEN-147
  test('日報データが必須項目を欠いている場合、InvalidReportDataErrorが発生する', () => {
    const invalidReportInput = {
      reporterId: 'user123',
      teamId: 'team01',
      reportDate: new Date('2026-08-19'),
      yesterdayAccomplishment: '',
      todayPlan: '本日の予定',
      issuesAndConcerns: '課題内容',
      attachmentUrls: [],
    };

    expect(() => saveReport(invalidReportInput)).toThrow(/日報データの形式が不正です。必須項目を確認してください。/);
  });
});