import { submitDailyReport } from '../../src/logic/daily-report-management';
import { type SubmitDailyReportInput, type SubmitDailyReportOutput } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム - 日報送信', () => {
  // SCEN-2193
  test('[normal] 日報入力検証機能 - 抱えている課題が空文字列の場合、該当項目にエラーメッセージが表示されて修正が促される', () => {
    const input: SubmitDailyReportInput = {
      userId: 'user-001',
      teamId: 'team-001',
      yesterdayAccomplishment: '昨日は機能Aの実装を完了しました。',
      todayPlan: '本日は機能Bのテストを実施します。',
      challenges: '',
      reportDate: '2024-01-15',
    };

    expect(() => submitDailyReport(input)).toThrow(/抱えている課題/);
  });
});