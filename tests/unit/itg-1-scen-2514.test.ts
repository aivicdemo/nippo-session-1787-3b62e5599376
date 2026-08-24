import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム - 日報送信', () => {
  // SCEN-2514
  test('初回テスト報告の入力検証 - テスト実施内容が空文字列のとき入力検証エラーが返される', () => {
    const input = {
      userId: 'user-001',
      teamId: 'team-001',
      yesterdayAccomplishment: '昨日は顧客会議に参加し、要件を確認しました。',
      todayPlan: '今日はシステム設計書を作成する予定です。',
      challenges: '',
      reportDate: '2024-01-15',
    };

    expect(() => submitDailyReport(input)).toThrow(/課題/);
  });
});