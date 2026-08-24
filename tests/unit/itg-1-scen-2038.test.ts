import { submitDailyReport } from '../../src/logic/daily-report-management';
import { type SubmitDailyReportInput, type SubmitDailyReportOutput } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム - 日報送信機能', () => {
  // SCEN-2038: [error] 対策案・実行計画の必須項目検証 - 実行予算額が負の数のとき検証エラーになる
  test('実行予算額が負の数値の場合、検証エラーが発生しフォーム送信は実行されない', () => {
    const input: SubmitDailyReportInput = {
      userId: 'ENG001',
      teamId: 'TEAM_A',
      yesterdayAccomplishment: '昨日は機能Aの実装を完了しました。テスト実施率は95%です。',
      todayPlan: '本日は機能Bの設計レビューを実施し、実装を開始します。',
      challenges: '予算管理システムの統合に課題があります。実行予算額の入力検証が必要です。',
      reportDate: '2024-01-15',
    };

    expect(() => submitDailyReport(input)).toThrow(/実行予算額/);
  });
});