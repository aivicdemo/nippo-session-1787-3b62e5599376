import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('朝会報告入力フォーム検証', () => {
  // SCEN-322: [error] 朝会報告入力フォーム検証 - 「抱えている課題」項目がスペースのみのとき、エラー表示される
  test('should reject submission when challenges field contains only whitespace', () => {
    const input = {
      userId: 'user-001',
      teamId: 'team-001',
      yesterdayAccomplishment: 'Completed the database migration task',
      todayPlan: 'Review pull requests and deploy to staging',
      challenges: '   ',
      reportDate: '2024-01-15',
    };

    expect(() => submitDailyReport(input)).toThrow(/抱えている課題/);
  });
});