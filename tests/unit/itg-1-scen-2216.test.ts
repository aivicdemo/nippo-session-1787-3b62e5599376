import { submitDailyReport } from '../../src/logic/daily-report-management';
import type { SubmitDailyReportInput, SubmitDailyReportOutput } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム - 日報送信', () => {
  // SCEN-2216: [error] 朝会報告の入力検証機能 - 抱えている課題に禁止文字が含まれるとき入力エラーが返される
  test('should reject challenges field with forbidden characters and return validation error', () => {
    const forbiddenInputs = [
      "<script>alert('xss')</script>",
      "; DROP TABLE --",
      "\x00\x01",
      "<img src=x onerror='alert(1)'>",
      "'; DELETE FROM daily_reports; --",
      "\0null byte",
      "<iframe src='malicious.com'></iframe>",
    ];

    forbiddenInputs.forEach((challengesText) => {
      const invalidInput: SubmitDailyReportInput = {
        userId: 'user-001',
        teamId: 'team-001',
        yesterdayAccomplishment: 'Completed database schema design',
        todayPlan: 'Start API development',
        challenges: challengesText,
        reportDate: '2024-01-15',
      };

      expect(() => submitDailyReport(invalidInput)).toThrow(/課題|禁止|形式|文字/);
    });
  });
});