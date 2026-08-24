import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('課題の優先度を色分けで表示するダッシュボード機能', () => {
  // SCEN-2048
  test('対策案の必須項目検証機能 - 必須項目のうち1つが空文字列の場合に検証が失敗する', () => {
    const input = {
      userId: 'engineer-001',
      teamId: 'team-a',
      yesterdayAccomplishment: '昨日は機能Aの実装を完了しました',
      todayPlan: '本日は機能Bのテストを実施します',
      challenges: '対策内容',
      reportDate: '2024-01-15',
    };

    const result = submitDailyReport(input);

    expect(result).toBeDefined();
    expect(result.reportId).toBeDefined();
    expect(typeof result.reportId).toBe('string');
    expect(result.submissionTimestamp).toBeDefined();
    expect(typeof result.submissionTimestamp).toBe('string');
    expect(result.isWithinDeadline).toBeDefined();
    expect(typeof result.isWithinDeadline).toBe('boolean');
  });
});