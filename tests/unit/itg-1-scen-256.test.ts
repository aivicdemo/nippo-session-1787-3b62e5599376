import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('部長向けダッシュボードのリアルタイム提出状況表示機能', () => {
  // SCEN-256: [error] 報告送信時刻の遅延判定機能 - 報告期限が空文字列のとき、エラーが発生して処理が進まない
  test('報告期限が空文字列の場合、バリデーションエラーが発生し送信処理が実行されない', () => {
    const input = {
      userId: 'eng-001',
      teamId: 'team-dev-a',
      yesterdayAccomplishment: 'データベース最適化の実装完了',
      todayPlan: 'API設計とドキュメント作成',
      challenges: 'フロントエンドとの連携が難航している',
      reportDate: '2024-01-15',
      reportDeadline: '',
    };

    expect(() => submitDailyReport(input)).toThrow(/報告期限/);
  });
});