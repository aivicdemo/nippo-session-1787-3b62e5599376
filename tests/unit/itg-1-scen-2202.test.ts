import { submitDailyReport } from '../../src/logic/daily-report-management';
import { type SubmitDailyReportInput } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム - 日報提出機能', () => {
  // SCEN-2202: [error] 朝会報告の入力検証機能 - 昨日やったことが空文字列のとき入力エラーが返される
  test('昨日やったことが空文字列のとき、必須項目エラーが返される', () => {
    const input: SubmitDailyReportInput = {
      userId: 'eng001',
      teamId: 'team-a',
      yesterdayAccomplishment: '',
      todayPlan: 'テスト実行',
      challenges: '課題なし',
      reportDate: '2024-01-15',
    };

    expect(() => submitDailyReport(input)).toThrow(/昨日やったこと/);
  });
});