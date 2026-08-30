import { submitReport } from '../../src/logic/report-submission-management';

describe('朝会報告管理システム', () => {
  test('SCEN-185: 昨日やったことが空のとき、エラーが throw される', () => {
    const input = {
      reporterId: 'eng-001',
      teamId: 'team-001',
      reportDate: new Date('2024-01-15'),
      yesterdayAccomplishment: '',
      todayPlan: '本日の予定テキスト',
      issuesAndConcerns: '課題内容テキスト',
    };

    expect(() => submitReport(input)).toThrow(/昨日やったことを入力してください/);
  });
});