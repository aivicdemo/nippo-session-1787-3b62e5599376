import { submitDailyReport } from '../../src/logic/daily-report-management';
import { type SubmitDailyReportInput, type SubmitDailyReportOutput } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム - 日報送信', () => {
  // SCEN-2208: [error] 朝会報告の入力検証機能 - 昨日やったことが必須文字数下限を下回るとき入力エラーが返される
  test('昨日やったことが1文字未満のとき、入力エラーが返される', () => {
    const invalidInput: SubmitDailyReportInput = {
      userId: 'user-001',
      teamId: 'team-001',
      yesterdayAccomplishment: '',
      todayPlan: 'implement new feature',
      challenges: 'database performance issue',
      reportDate: '2024-01-15',
    };

    expect(() => submitDailyReport(invalidInput)).toThrow(/昨日やったこと/);
  });
});