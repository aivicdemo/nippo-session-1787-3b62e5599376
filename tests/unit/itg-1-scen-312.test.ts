import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム - 日報送信', () => {
  // SCEN-312: [error] 朝会報告入力フォーム検証 - 「昨日やったこと」項目がnullのとき、エラー表示される
  test('should reject submission when yesterdayAccomplishment is null', () => {
    const input = {
      userId: 'user-001',
      teamId: 'team-001',
      yesterdayAccomplishment: null as unknown as string,
      todayPlan: 'テスト実施',
      challenges: 'バグ修正',
      reportDate: '2024-01-15',
    };

    expect(() => submitDailyReport(input)).toThrow(/昨日やったこと/);
  });
});