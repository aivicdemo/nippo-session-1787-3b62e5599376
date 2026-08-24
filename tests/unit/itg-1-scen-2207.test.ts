import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム', () => {
  // SCEN-2207
  test('朝会報告の入力検証機能 - 抱えている課題が未入力（null）のとき入力エラーが返される', () => {
    const input = {
      userId: 'user-001',
      teamId: 'team-001',
      yesterdayAccomplishment: '顧客A社の打ち合わせ実施',
      todayPlan: '提案資料の作成',
      challenges: null as unknown as string,
      reportDate: '2024-01-15'
    };

    expect(() => submitDailyReport(input)).toThrow(/抱えている課題/);
  });
});