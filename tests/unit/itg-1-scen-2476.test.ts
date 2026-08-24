import { submitDailyReport } from '../../src/logic/daily-report-management';
import { type SubmitDailyReportInput, type SubmitDailyReportOutput } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム - 日報提出機能', () => {
  // SCEN-2476
  test('操作習熟度スコア計算機能 - 操作ログが完全に欠落しているとき、エラーを返す', () => {
    const input: SubmitDailyReportInput = {
      userId: 'engineer-001',
      teamId: 'team-A',
      yesterdayAccomplishment: '昨日は機能Aの実装を完了しました',
      todayPlan: '今日は機能Bのテストを開始します',
      challenges: 'APIの接続がたまに失敗することがあります',
      reportDate: '2024-01-15',
    };

    expect(() => {
      submitDailyReport(input);
    }).toThrow(/操作ログ/);
  });
});