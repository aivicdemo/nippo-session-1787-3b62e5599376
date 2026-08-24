import { submitDailyReport } from '../../src/logic/daily-report-management';
import { type SubmitDailyReportInput, type SubmitDailyReportOutput } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム - 日報送信', () => {
  // SCEN-2512: [error] 初回テスト報告の入力検証 - 報告日時が欠落しているとき入力検証エラーが返される
  test('報告日時が欠落している場合、入力検証エラーが返される', () => {
    const inputWithMissingReportDate: SubmitDailyReportInput = {
      userId: 'user-001',
      teamId: 'team-001',
      yesterdayAccomplishment: 'タスクA完了',
      todayPlan: 'タスクB開始',
      challenges: 'リソース不足',
      reportDate: '',
    };

    expect(() => submitDailyReport(inputWithMissingReportDate)).toThrow(/報告日時/);
  });
});