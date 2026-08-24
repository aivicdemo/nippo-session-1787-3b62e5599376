import { submitDailyReport } from '../../src/logic/daily-report-management';
import type { SubmitDailyReportInput, SubmitDailyReportOutput } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム - 日報送信機能', () => {
  // SCEN-2541: [edge] 初回テスト報告の入力検証機能 - チーム ID が有効な値である場合、チーム参照検証が合格となる
  test('有効なチーム ID で日報を送信した場合、チーム検証に合格してレポートが保存される', async () => {
    const input: SubmitDailyReportInput = {
      userId: 'user-001',
      teamId: 'team-001',
      yesterdayAccomplishment: '前日のタスクを完了しました',
      todayPlan: '本日の予定を設定しました',
      challenges: '現在抱えている課題があります',
      reportDate: '2024-01-15'
    };

    const result: SubmitDailyReportOutput = await submitDailyReport(input);

    expect(result).toHaveProperty('reportId');
    expect(typeof result.reportId).toBe('string');
    expect(result.reportId).toBeTruthy();
    expect(result).toHaveProperty('submissionTimestamp');
    expect(typeof result.submissionTimestamp).toBe('string');
    expect(result.submissionTimestamp).toBeTruthy();
    expect(result).toHaveProperty('isWithinDeadline');
    expect(typeof result.isWithinDeadline).toBe('boolean');
  });
});