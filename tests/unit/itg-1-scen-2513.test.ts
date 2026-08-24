import { submitDailyReport } from '../../src/logic/daily-report-management';
import { type SubmitDailyReportInput } from '../../src/logic/daily-report-management';

describe('Daily Report Management - Submit Daily Report Validation', () => {
  // SCEN-2513: [error] 初回テスト報告の入力検証 - テスト実施内容が欠落しているとき入力検証エラーが返される
  test('should return validation error when challenges field is empty', async () => {
    const invalidInput: SubmitDailyReportInput = {
      userId: 'user-test-001',
      teamId: 'team-dev-001',
      yesterdayAccomplishment: 'Completed unit tests for authentication module',
      todayPlan: 'Implement user profile feature and review pull requests',
      challenges: '',
      reportDate: '2024-01-15',
    };

    expect(() => submitDailyReport(invalidInput)).toThrow(/課題/);
  });
});