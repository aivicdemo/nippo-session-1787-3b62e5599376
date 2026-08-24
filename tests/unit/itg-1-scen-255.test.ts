import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム - 報告送信時刻の遅延判定機能', () => {
  // SCEN-255
  test('報告送信時刻が空文字列のとき、バリデーションエラーが発生して処理が中断される', () => {
    const input = {
      reportId: 'report-001',
      userId: 'user-123',
      submissionTimestamp: new Date('2024-01-15T09:15:00Z'),
      reportContent: {
        yesterdayAccomplishment: 'テスト環境のセットアップを完了した',
        todayPlan: 'ユーザー認証機能の実装を開始する',
        challenges: '外部API連携に遅延が発生している'
      }
    };

    expect(() => submitDailyReport(input)).toThrow(/報告送信時刻/);
  });
});