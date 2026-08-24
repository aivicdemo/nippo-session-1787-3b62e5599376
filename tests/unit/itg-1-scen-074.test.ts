import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('毎朝の定時にチームメンバーへ報告入力のリマインド通知を自動送信する機能', () => {
  // SCEN-074
  test('チームIDが空文字のとき処理が進まずエラーを返す', () => {
    const input = {
      userId: 'user-001',
      teamId: '',
      yesterdayAccomplishment: 'システムの初期設定を完了した',
      todayPlan: '機能テストを実施する予定',
      challenges: 'テスト環境の不安定性',
      reportDate: '2024-01-15',
    };

    expect(() => submitDailyReport(input)).toThrow(/チームID/);
  });
});