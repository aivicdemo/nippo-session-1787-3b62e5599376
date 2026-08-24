import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('課題の優先度を色分けで表示するダッシュボード機能', () => {
  // SCEN-2057
  test('対策案の優先度スコアが上限値(101)を超過した場合に検証が失敗する', () => {
    const input: Parameters<typeof submitDailyReport>[0] = {
      userId: 'user-001',
      teamId: 'team-001',
      yesterdayAccomplishment: 'Completed database migration',
      todayPlan: 'Review test coverage',
      challenges: 'Priority score validation in countermeasure proposals',
      reportDate: '2024-01-15',
    };

    const result = submitDailyReport(input);

    expect(result).toEqual(
      expect.objectContaining({
        isValid: false,
        errors: expect.arrayContaining([
          expect.stringMatching(/優先度スコア.*0.*100.*範囲/),
        ]),
      })
    );
  });
});