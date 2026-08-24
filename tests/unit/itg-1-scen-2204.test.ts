import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム', () => {
  // SCEN-2204
  test('[error] 朝会報告の入力検証機能 - 今日やることが空文字列のとき入力エラーが返される', () => {
    const input = {
      userId: 'user-001',
      teamId: 'team-001',
      yesterdayAccomplishment: '昨日の実績テキスト',
      todayPlan: '',
      challenges: '抱えている課題テキスト',
      reportDate: '2024-01-15',
    };

    expect(() => submitDailyReport(input)).toThrow(/今日やること/);
  });
});