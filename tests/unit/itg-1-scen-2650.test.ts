import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('Daily Report Management - Submit Daily Report', () => {
  test('SCEN-2650: [error] 初回テスト報告入力検証機能 - 報告内容の文字数が運用ルール下限を下回るとき不合格判定となる', () => {
    const input = {
      userId: 'test-user-001',
      teamId: 'team-alpha',
      yesterdayAccomplishment: 'a',
      todayPlan: '',
      challenges: '',
      reportDate: '2024-01-15'
    };

    expect(() => submitDailyReport(input)).toThrow(/最低3文字/);
  });
});