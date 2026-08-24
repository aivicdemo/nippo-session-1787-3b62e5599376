import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム - 日報入力バリデーション機能', () => {
  // SCEN-335: [edge] 日報入力バリデーション機能 - 抱えている課題が1文字のとき入力ルールを満たす
  test('抱えている課題が1文字の場合、バリデーションを満たして送信可能', async () => {
    const input = {
      userId: 'user-001',
      teamId: 'team-001',
      yesterdayAccomplishment: 'データベース最適化を実施した',
      todayPlan: 'APIエンドポイントの実装を進める',
      challenges: 'A',
      reportDate: '2024-01-15',
    };

    const result = await submitDailyReport(input);

    expect(result.reportId).toBeDefined();
    expect(typeof result.reportId).toBe('string');
    expect(result.reportId.length).toBeGreaterThan(0);
    expect(result.submissionTimestamp).toBeDefined();
    expect(typeof result.submissionTimestamp).toBe('string');
    expect(result.isWithinDeadline).toBe(true);
  });
});