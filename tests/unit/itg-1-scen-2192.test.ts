import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム - 日報入力検証', () => {
  // SCEN-2192
  test('今日やることが空文字列の場合、該当項目にエラーメッセージが表示されて修正が促される', () => {
    const input = {
      userId: 'user-001',
      teamId: 'team-001',
      yesterdayAccomplishment: '昨日は機能A の実装を完了した',
      todayPlan: '',
      challenges: '機能B の仕様書がまだ届いていない',
      reportDate: '2024-01-15',
    };

    const result = submitDailyReport(input);

    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/今日やること/),
      ])
    );
    expect(result.errors?.length).toBeGreaterThan(0);
  });
});