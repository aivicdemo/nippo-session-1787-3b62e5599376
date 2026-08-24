import { submitDailyReport } from '../../src/logic/daily-report-management';
import { type SubmitDailyReportInput, type SubmitDailyReportOutput } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム', () => {
  // SCEN-332: [edge] 日報入力バリデーション機能 - 今日やることが文字数制限上限ちょうどのとき入力ルールを満たす
  test('submitDailyReport: 今日やることが200文字ちょうどの場合、バリデーションエラーなく送信・保存される', async () => {
    const todayPlanExactLimit = 'A'.repeat(200);
    
    const input: SubmitDailyReportInput = {
      userId: 'test-user-001',
      teamId: 'team-engineering-001',
      yesterdayAccomplishment: 'Completed API integration testing for user authentication module.',
      todayPlan: todayPlanExactLimit,
      challenges: 'Database query performance degradation on production environment.',
      reportDate: '2024-01-15',
    };

    const output: SubmitDailyReportOutput = await submitDailyReport(input);

    expect(output).toHaveProperty('reportId');
    expect(typeof output.reportId).toBe('string');
    expect(output.reportId.length).toBeGreaterThan(0);

    expect(output).toHaveProperty('submissionTimestamp');
    expect(typeof output.submissionTimestamp).toBe('string');
    const timestampDate = new Date(output.submissionTimestamp);
    expect(timestampDate.getTime()).toBeGreaterThan(0);

    expect(output).toHaveProperty('isWithinDeadline');
    expect(typeof output.isWithinDeadline).toBe('boolean');
  });
});