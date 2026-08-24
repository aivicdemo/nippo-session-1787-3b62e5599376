import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム - 日報入力バリデーション機能', () => {
  // SCEN-329: [edge] 日報入力バリデーション機能 - 昨日やったことが文字数制限上限を1文字超過するとき該当項目がエラー表示される
  test('should reject submission when yesterdayAccomplishment exceeds 2000 character limit by 1 character', () => {
    // Setup: Create a string with exactly 2001 characters (1 character over the limit)
    const oversizedYesterdayAccomplishment = 'a'.repeat(2001);
    
    const submissionInput = {
      userId: 'engineer-001',
      teamId: 'team-alpha',
      yesterdayAccomplishment: oversizedYesterdayAccomplishment,
      todayPlan: 'Today I will implement the authentication module',
      challenges: 'Database connection timeout issues',
      reportDate: '2024-01-15'
    };

    // Execute and verify: Calling submitDailyReport should throw an error
    expect(() => {
      submitDailyReport(submissionInput);
    }).toThrow(/文字数制限|上限|超過/);
  });
});