import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム', () => {
  test('SCEN-320: [error] 朝会報告入力フォーム検証 - 「抱えている課題」項目がnullのとき、エラー表示される', () => {
    const input = {
      userId: 'eng-001',
      teamId: 'team-alpha',
      yesterdayAccomplishment: '前日の実績として有効なテキストを入力した状態です',
      todayPlan: '本日の予定として有効なテキストを入力した状態です',
      challenges: null as unknown as string,
      reportDate: '2024-01-15',
    };

    const result = submitDailyReport(input);

    expect(result.isValid).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors).toContain(expect.stringMatching(/抱えている課題/));
    expect(result.errors?.length).toBeGreaterThan(0);
  });
});