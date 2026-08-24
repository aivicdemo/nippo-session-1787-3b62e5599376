import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム - 日報送信', () => {
  // SCEN-313
  test('昨日やったこと項目が未定義のとき、検証エラーが発生する', () => {
    const input = {
      userId: 'user-001',
      teamId: 'team-001',
      yesterdayAccomplishment: undefined as any,
      todayPlan: '本日の予定テキスト',
      challenges: '抱えている課題テキスト',
      reportDate: '2024-01-15',
    };

    expect(() => submitDailyReport(input)).toThrow(/昨日やったこと/);
  });
});