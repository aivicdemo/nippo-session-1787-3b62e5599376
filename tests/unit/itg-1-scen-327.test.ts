import { submitDailyReport } from '../../src/logic/daily-report-management';
import type { SubmitDailyReportInput, SubmitDailyReportOutput } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム - 日報入力バリデーション', () => {
  // SCEN-327: [edge] 日報入力バリデーション機能 - 昨日やったことが1文字のとき入力ルールを満たす
  test('昨日やったことが1文字の場合、バリデーションエラーなく送信できる', () => {
    const userId = 'user-001';
    const teamId = 'team-001';
    const reportDate = '2024-01-15';
    const submissionTimestamp = new Date('2024-01-15T08:30:00Z');

    const input: SubmitDailyReportInput = {
      userId,
      teamId,
      yesterdayAccomplishment: 'A',
      todayPlan: 'Complete project documentation and code review for feature X',
      challenges: 'API integration with third-party service experiencing timeout',
      reportDate,
    };

    const result: SubmitDailyReportOutput = submitDailyReport(input, submissionTimestamp);

    expect(result).toHaveProperty('reportId');
    expect(typeof result.reportId).toBe('string');
    expect(result.reportId.length).toBeGreaterThan(0);

    expect(result).toHaveProperty('submissionTimestamp');
    expect(result.submissionTimestamp).toBe('2024-01-15T08:30:00Z');

    expect(result).toHaveProperty('isWithinDeadline');
    expect(typeof result.isWithinDeadline).toBe('boolean');
  });
});