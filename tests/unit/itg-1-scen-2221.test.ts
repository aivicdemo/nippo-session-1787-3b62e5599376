import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('朝会報告の課題キーワード抽出と優先度付け表示', () => {
  // SCEN-2221
  test('報告項目テキストが最大許容文字数を1文字下回り検証に合格する', () => {
    const testTextWith3999Chars = 'a'.repeat(3999);

    const input = {
      userId: 'user-123',
      teamId: 'team-001',
      yesterdayAccomplishment: testTextWith3999Chars,
      todayPlan: 'Today plan content',
      challenges: 'Current challenges',
      reportDate: '2024-01-15',
    };

    const result = submitDailyReport(input);

    expect(result).toBeDefined();
    expect(result.reportId).toBeDefined();
    expect(result.submissionTimestamp).toBeDefined();
    expect(typeof result.isWithinDeadline).toBe('boolean');
  });
});