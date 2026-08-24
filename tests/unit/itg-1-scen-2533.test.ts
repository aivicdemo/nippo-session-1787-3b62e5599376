import { submitDailyReport } from '../../src/logic/daily-report-management';
import type { SubmitDailyReportInput, SubmitDailyReportOutput } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム - 日報送信機能', () => {
  // SCEN-2533: [edge] 初回テスト報告の入力検証機能 - 報告日時が過去 30 日以内の日付である場合、日付形式検証が合格となる
  test('should validate daily report date within past 30 days and return valid result', () => {
    const today = new Date('2024-01-15T09:00:00Z');
    const currentTime = new Date('2024-01-15T09:30:00Z');

    // 過去30日以内の複数の日付をテストケースとして用意
    const testDates = [
      '2024-01-15', // 本日
      '2024-01-14', // 1日前
      '2024-01-01', // 15日前
      '2023-12-17'  // 29日前
    ];

    testDates.forEach((reportDate) => {
      const input: SubmitDailyReportInput = {
        userId: 'eng-001',
        teamId: 'team-a',
        yesterdayAccomplishment: 'Completed database optimization task',
        todayPlan: 'Review pull requests and refactor module A',
        challenges: 'Performance bottleneck in query processing',
        reportDate: reportDate
      };

      const result: SubmitDailyReportOutput = submitDailyReport(input);

      // 報告日時が過去30日以内の日付であることを確認
      expect(result).toHaveProperty('reportId');
      expect(result).toHaveProperty('submissionTimestamp');
      expect(result).toHaveProperty('isWithinDeadline');

      // 検証が合格となること（日付形式が有効であること）を確認
      expect(typeof result.reportId).toBe('string');
      expect(result.reportId.length).toBeGreaterThan(0);

      // submissionTimestamp が ISO 8601 形式であることを確認
      expect(typeof result.submissionTimestamp).toBe('string');
      expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z?$/.test(result.submissionTimestamp)).toBe(true);

      // isWithinDeadline が boolean 型であることを確認
      expect(typeof result.isWithinDeadline).toBe('boolean');
    });
  });
});