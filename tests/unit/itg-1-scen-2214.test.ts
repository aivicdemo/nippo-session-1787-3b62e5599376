import { submitDailyReport } from '../../src/logic/daily-report-management';
import { type SubmitDailyReportInput, type SubmitDailyReportOutput } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム - 日報送信機能', () => {
  // SCEN-2214
  test('[error] 朝会報告の入力検証機能 - 昨日やったことに禁止文字が含まれるとき入力エラーが返される', () => {
    const input: SubmitDailyReportInput = {
      userId: 'user-001',
      teamId: 'team-A',
      yesterdayAccomplishment: "<script>alert('test')</script>",
      todayPlan: 'ドキュメント作成',
      challenges: 'API接続エラー',
      reportDate: '2024-01-15'
    };

    expect(() => submitDailyReport(input)).toThrow(/禁止文字|使用できない文字/);
  });
});