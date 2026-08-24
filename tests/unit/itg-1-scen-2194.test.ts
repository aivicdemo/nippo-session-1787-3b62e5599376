import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム - 日報送信検証', () => {
  // SCEN-2194: [normal] 日報入力検証機能 - 3つの項目すべてが空文字列の場合、すべての項目にエラーメッセージが表示されて修正が促される
  test('should return validation errors for all three required fields when they are empty strings', () => {
    const input = {
      userId: 'eng-001',
      teamId: 'team-A',
      yesterdayAccomplishment: '',
      todayPlan: '',
      challenges: '',
      reportDate: '2024-01-15'
    };

    const result = submitDailyReport(input);

    expect(result.isValid).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors).toHaveLength(3);
    expect(result.errors).toContain(expect.stringMatching(/昨日/i));
    expect(result.errors).toContain(expect.stringMatching(/今日/i));
    expect(result.errors).toContain(expect.stringMatching(/課題/i));
  });
});