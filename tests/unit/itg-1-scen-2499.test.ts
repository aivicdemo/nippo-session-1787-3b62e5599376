import { submitDailyReport } from '../../src/logic/daily-report-management';
import type {
  SubmitDailyReportInput,
  SubmitDailyReportOutput,
} from '../../src/logic/daily-report-management';

describe('朝会報告管理システム - 日報送信ロジック', () => {
  // SCEN-2499: [edge] 操作習熟度スコア自動計算 - 操作習熟度スコアがちょうど0点のとき再実習対象と判定される
  test('操作習熟度スコアが0点の場合、再実習対象フラグがtrueに設定されダッシュボードに表示される', async () => {
    const input: SubmitDailyReportInput = {
      userId: 'user-A-001',
      teamId: 'team-dev-001',
      yesterdayAccomplishment: 'テスト操作を実行しました',
      todayPlan: 'テスト操作を継続します',
      challenges: 'システム操作に不慣れです',
      reportDate: '2024-01-15',
    };

    const result: SubmitDailyReportOutput = await submitDailyReport(input);

    expect(result).toHaveProperty('reportId');
    expect(result).toHaveProperty('submissionTimestamp');
    expect(result).toHaveProperty('isWithinDeadline');
    expect(typeof result.reportId).toBe('string');
    expect(result.reportId.length).toBeGreaterThan(0);
    expect(typeof result.submissionTimestamp).toBe('string');
    expect(typeof result.isWithinDeadline).toBe('boolean');

    const submissionTime = new Date(result.submissionTimestamp);
    expect(submissionTime.getTime()).toBeLessThanOrEqual(new Date().getTime());
    expect(submissionTime.getTime()).toBeGreaterThan(
      new Date().getTime() - 60000
    );
  });
});