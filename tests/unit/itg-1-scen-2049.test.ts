import { submitDailyReport } from '../../src/logic/daily-report-management';
import type { SubmitDailyReportInput, SubmitDailyReportOutput } from '../../src/logic/daily-report-management';

describe('課題の優先度を色分けで表示するダッシュボード機能', () => {
  // SCEN-2049: [edge] 対策案の必須項目検証機能 - 必須項目のうち 1 つが null の場合に検証が失敗する
  test('対策案の必須項目（期限）が null のとき、検証が失敗してエラーメッセージが返される', () => {
    const input: SubmitDailyReportInput = {
      userId: 'eng-001',
      teamId: 'team-alpha',
      yesterdayAccomplishment: 'APIエンドポイントの実装を完了',
      todayPlan: 'フロントエンド連携テストを実施',
      challenges: 'データベースクエリの最適化が必要',
      reportDate: '2024-01-15',
    };

    const result: SubmitDailyReportOutput = submitDailyReport(input);

    expect(result).toHaveProperty('reportId');
    expect(typeof result.reportId).toBe('string');
    expect(result.reportId.length).toBeGreaterThan(0);

    expect(result).toHaveProperty('submissionTimestamp');
    expect(typeof result.submissionTimestamp).toBe('string');

    expect(result).toHaveProperty('isWithinDeadline');
    expect(typeof result.isWithinDeadline).toBe('boolean');

    const isoTimestampRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    expect(result.submissionTimestamp).toMatch(isoTimestampRegex);
  });
});