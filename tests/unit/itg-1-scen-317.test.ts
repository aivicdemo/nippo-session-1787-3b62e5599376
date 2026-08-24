import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム - 日報送信', () => {
  // SCEN-317
  test('[error] 朝会報告入力フォーム検証 - 「今日やること」項目が未定義（undefined）のとき、エラー表示される', () => {
    const input = {
      userId: 'user-001',
      teamId: 'team-001',
      yesterdayAccomplishment: '昨日は会議対応',
      todayPlan: undefined,
      challenges: 'ネットワーク遅延',
      reportDate: '2024-01-15',
    };

    expect(() => submitDailyReport(input)).toThrow(/今日やること/);
  });
});