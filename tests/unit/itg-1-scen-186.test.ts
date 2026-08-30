import { submitReport } from '../../src/logic/report-submission-management';

describe('朝会報告管理システム', () => {
  test('SCEN-186: submitReport は todayPlan が空文字列のとき ValidationError をスロー', () => {
    const input = {
      reporterId: 'ENG001',
      teamId: 'TEAM-A',
      reportDate: new Date('2024-01-15'),
      yesterdayAccomplishment: '昨日の作業内容',
      todayPlan: '',
      issuesAndConcerns: '課題内容',
    };

    expect(() => submitReport(input)).toThrow(/今日やること/);
  });
});