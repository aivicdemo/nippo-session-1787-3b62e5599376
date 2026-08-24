import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム - 日報送信機能', () => {
  // SCEN-2190: [normal] 日報入力検証機能 - 3つの必須項目がすべて入力されている場合、検証に合格して送信が確定される
  test('should accept and confirm submission when all three required fields are filled with valid content', () => {
    const input = {
      userId: 'user-001',
      teamId: 'team-001',
      yesterdayAccomplishment: '顧客A社との打ち合わせ完了',
      todayPlan: '顧客B社提案資料作成',
      challenges: 'プロジェクトXの予算調整',
      reportDate: '2024-01-15',
    };

    const result = submitDailyReport(input);

    expect(result).toHaveProperty('reportId');
    expect(result).toHaveProperty('submissionTimestamp');
    expect(result).toHaveProperty('isWithinDeadline');
    expect(typeof result.reportId).toBe('string');
    expect(result.reportId.length).toBeGreaterThan(0);
    expect(typeof result.submissionTimestamp).toBe('string');
    expect(typeof result.isWithinDeadline).toBe('boolean');
  });
});