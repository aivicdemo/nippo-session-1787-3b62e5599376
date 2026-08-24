import { submitDailyReport } from '../../src/logic/daily-report-management';
import { type SubmitDailyReportInput, type SubmitDailyReportOutput } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム', () => {
  // SCEN-2488: [error] 操作習熟度スコア計算機能 - 操作ステップの時刻がログイン時刻より前のとき、エラーを返す
  test('submitDailyReport should return error when operation timestamp is before login time', () => {
    const loginTimestamp = new Date('2026-08-20T09:00:00Z');
    const operationTimestamp = new Date('2026-08-20T08:55:00Z');

    const input: SubmitDailyReportInput = {
      userId: 'user-A',
      teamId: 'team-001',
      yesterdayAccomplishment: 'Yesterday task completed successfully',
      todayPlan: 'Today planning in progress',
      challenges: 'Current challenge with system integration',
      reportDate: '2026-08-20',
      operationTimestamps: {
        loginTime: loginTimestamp,
        reportInputTime: operationTimestamp,
        submissionTime: new Date('2026-08-20T09:05:00Z'),
      },
    };

    const result = submitDailyReport(input);

    expect(result).toHaveProperty('error');
    expect(result.error).toHaveProperty('errorCode', 'OPERATION_TIMESTAMP_BEFORE_LOGIN');
    expect(result.error.message).toMatch(/操作時刻がログイン時刻より前です/);
    expect(result.error.message).toContain('2026-08-20T09:00:00Z');
    expect(result.error.message).toContain('2026-08-20T08:55:00Z');
    expect(result.proficiencyScore).toBeNull();
  });
});