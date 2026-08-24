import { submitDailyReport } from '../../src/logic/daily-report-management';
import { type SubmitDailyReportInput, type SubmitDailyReportOutput } from '../../src/logic/daily-report-management';

describe('submitDailyReport', () => {
  // SCEN-2481: [error] 操作習熟度スコア計算機能 - ログイン完了時刻が無効な日時形式のとき、エラーを返す
  test('should return error when submissionTimestamp is in invalid datetime format', () => {
    const invalidInput: SubmitDailyReportInput = {
      userId: 'user-001',
      teamId: 'team-001',
      yesterdayAccomplishment: 'Completed task A and reviewed code',
      todayPlan: 'Will start task B and attend meetings',
      challenges: 'Need to resolve API integration issue',
      reportDate: '2024-01-15',
    };

    // Pass invalid timestamp directly to the function
    // The function should handle validation internally
    const invalidTimestamp = '2024-13-45 25:70:90';

    expect(() => {
      submitDailyReport({
        ...invalidInput,
        submissionTimestamp: invalidTimestamp,
      } as any);
    }).toThrow(/INVALID_DATETIME_FORMAT/);
  });
});