import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム - 日報送信機能', () => {
  // SCEN-311: [error] 朝会報告入力フォーム検証 - 「昨日やったこと」項目が空文字列のとき、エラー表示される
  test('should reject submission when yesterdayAccomplishment is empty string', () => {
    const input = {
      userId: 'user-001',
      teamId: 'team-001',
      yesterdayAccomplishment: '',
      todayPlan: '会議資料作成',
      challenges: 'ネットワーク遅延',
      reportDate: '2024-01-15',
    };

    expect(() => submitDailyReport(input)).toThrow(/昨日やったこと/);
  });
});