import { submitDailyReport } from '../../src/logic/daily-report-management';
import { type SubmitDailyReportInput, type SubmitDailyReportOutput } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム - 日報送信', () => {
  // SCEN-2034: [error] 対策案・実行計画の必須項目検証 - 承認権者（開発部長）の指定が空のとき検証エラーになる
  test('承認権者が空の場合、送信が失敗し、エラーメッセージが表示される', () => {
    const input: SubmitDailyReportInput = {
      userId: 'engineer-001',
      teamId: 'team-001',
      yesterdayAccomplishment: 'APIの実装を完了した',
      todayPlan: 'データベース設計を実施する',
      challenges: 'チーム間の連携調整が課題',
      reportDate: '2024-01-15',
      countermeasureContent: '定期的な進捗確認会議を開催',
      executionPlan: '毎週月曜日10時に会議を実施',
      executionDeadline: '2024-02-28',
      approverManagerId: '',
    };

    expect(() => submitDailyReport(input)).toThrow(/承認権者/);
  });
});