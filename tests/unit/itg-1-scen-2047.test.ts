import { submitDailyReport } from '../../src/logic/daily-report-management';
import { type SubmitDailyReportInput, type SubmitDailyReportOutput } from '../../src/logic/daily-report-management';

describe('課題の優先度を色分けで表示するダッシュボード機能', () => {
  // SCEN-2047: [edge] 対策案の必須項目検証機能 - 必須項目がすべて入力された状態で検証がパスする
  test('submitDailyReport: 必須項目がすべて入力されたとき、検証がパスして報告が保存される', () => {
    const input: SubmitDailyReportInput = {
      userId: 'user-001',
      teamId: 'team-001',
      yesterdayAccomplishment: 'データベース接続タイムアウト対応完了',
      todayPlan: 'ユーザーインターフェース改善実装予定',
      challenges: 'データベース接続タイムアウト対応',
      reportDate: '2024-01-25',
    };

    const result: SubmitDailyReportOutput = submitDailyReport(input);

    expect(result).toBeDefined();
    expect(result.reportId).toBeDefined();
    expect(typeof result.reportId).toBe('string');
    expect(result.reportId.length).toBeGreaterThan(0);
    expect(result.submissionTimestamp).toBeDefined();
    expect(typeof result.submissionTimestamp).toBe('string');
    expect(result.isWithinDeadline).toBe(true);
  });
});