import { submitDailyReport } from '../../src/logic/daily-report-management';
import { type SubmitDailyReportInput, type SubmitDailyReportOutput } from '../../src/logic/daily-report-management';

describe('Daily Report Management - submitDailyReport', () => {
  // SCEN-2531: [edge] 初回テスト報告の入力検証機能 - 報告日時が本日の日付である場合、日付形式検証が合格となる
  test('should pass date format validation when reportDate is today in YYYY-MM-DD format', () => {
    // Arrange: システムの現在日時をモック化して本日の日付に設定
    const today = new Date('2026-08-19T00:00:00Z');
    const originalNow = Date.now;
    Date.now = jest.fn(() => today.getTime());

    const reportDateString = '2026-08-19';
    const input: SubmitDailyReportInput = {
      userId: 'user-001',
      teamId: 'team-001',
      yesterdayAccomplishment: 'データベーススキーマの設計完了',
      todayPlan: 'APIサーバーの実装開始',
      challenges: 'チーム間の意思疎通の不足',
      reportDate: reportDateString,
    };

    // Act: submitDailyReport を呼び出して報告を送信
    const result = submitDailyReport(input);

    // Assert: 日付形式検証が合格し、reportId と submissionTimestamp が返却されることを確認
    expect(result).toBeDefined();
    expect(result.reportId).toBeTruthy();
    expect(typeof result.reportId).toBe('string');
    expect(result.reportId.length).toBeGreaterThan(0);

    expect(result.submissionTimestamp).toBeTruthy();
    expect(typeof result.submissionTimestamp).toBe('string');

    // submissionTimestamp が ISO 8601 形式であることを確認
    const submissionTime = new Date(result.submissionTimestamp);
    expect(submissionTime).toBeInstanceOf(Date);
    expect(isNaN(submissionTime.getTime())).toBe(false);

    // isWithinDeadline フラグは期限内（true）であることを確認
    expect(result.isWithinDeadline).toBe(true);

    // Clean up
    Date.now = originalNow;
  });
});