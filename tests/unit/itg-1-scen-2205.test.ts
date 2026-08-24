import { submitDailyReport } from '../../src/logic/daily-report-management';
import { type SubmitDailyReportInput } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム - 日報送信機能', () => {
  // SCEN-2205: [error] 朝会報告の入力検証機能 - 今日やることが未入力（null）のとき入力エラーが返される
  test('今日やることが未入力（null）の場合、入力検証エラーが返される', () => {
    const input: SubmitDailyReportInput = {
      userId: 'user-001',
      teamId: 'team-001',
      yesterdayAccomplishment: '顧客A案件のバグ修正',
      todayPlan: null as any,
      challenges: '環境構築が遅れている',
      reportDate: '2024-01-15'
    };

    expect(() => submitDailyReport(input)).toThrow(/今日やること/);
  });
});