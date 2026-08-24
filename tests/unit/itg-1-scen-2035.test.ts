import { submitDailyReport } from '../../src/logic/daily-report-management';
import { type SubmitDailyReportInput, type SubmitDailyReportOutput } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム - 日報送信', () => {
  // SCEN-2035: [error] 対策案・実行計画の必須項目検証 - 承認権者（開発部長）の指定がnullのとき検証エラーになる
  test('承認権者がnullの場合、バリデーションエラーが発生する', () => {
    const input: SubmitDailyReportInput = {
      userId: 'user-001',
      teamId: 'team-001',
      yesterdayAccomplishment: 'API実装を完了した',
      todayPlan: '単体テストを実施する',
      challenges: 'データベース接続の遅延が発生している',
      reportDate: '2024-01-15',
    };

    expect(() => submitDailyReport(input)).toThrow(/承認権者/);
  });
});