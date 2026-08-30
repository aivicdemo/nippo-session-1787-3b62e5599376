import { submitReport } from '../../src/logic/report-submission-management';

describe('朝会報告管理システム - 日報送信', () => {
  // SCEN-183
  test('エンジニアが日報を送信し、本日の予定が空またはスペースのみのときはエラーを返す', () => {
    const input = {
      reporterId: 'eng001',
      teamId: 'team-A',
      reportDate: new Date('2024-01-15'),
      yesterdayAccomplishment: '昨日の実績',
      todayPlan: '',
      issuesAndConcerns: '課題内容',
    };

    expect(() => submitReport(input)).toThrow(/今日やることを入力してください/);
  });
});