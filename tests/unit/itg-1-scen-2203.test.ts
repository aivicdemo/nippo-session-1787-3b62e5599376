import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム - 日報送信検証', () => {
  // SCEN-2203: [error] 朝会報告の入力検証機能 - 昨日やったことが未入力（null）のとき入力エラーが返される
  test('should return validation error when yesterdayAccomplishment is null', () => {
    const input = {
      userId: 'engineer001',
      teamId: 'team-dev-01',
      yesterdayAccomplishment: null as unknown as string,
      todayPlan: 'タスクA',
      challenges: '課題1',
      reportDate: '2024-01-15',
    };

    expect(() => submitDailyReport(input)).toThrow(/昨日やったこと/);
  });
});