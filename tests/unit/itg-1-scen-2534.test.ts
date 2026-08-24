import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム - 日報送信', () => {
  // SCEN-2534: [edge] 初回テスト報告の入力検証機能 - 報告日時が過去 31 日以上前の日付である場合、日付形式検証が不合格となる
  test('報告日時が過去31日以上前の場合、バリデーション失敗エラーメッセージを表示する', () => {
    const currentDate = new Date('2026-08-19T00:00:00Z');
    const thirtyOneDaysAgo = new Date('2026-07-19T00:00:00Z');
    const reportDateStr = '2026-07-19';

    const input = {
      userId: 'user-001',
      teamId: 'team-001',
      yesterdayAccomplishment: 'システムの初期化処理を完了した',
      todayPlan: '本体システムの機能テストを開始する',
      challenges: 'テスト環境の構築に時間がかかっている',
      reportDate: reportDateStr,
    };

    expect(() => submitDailyReport(input, currentDate)).toThrow(/報告日時は過去30日以内/);
  });
});