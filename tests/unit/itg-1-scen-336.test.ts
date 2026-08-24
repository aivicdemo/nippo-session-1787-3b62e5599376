import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('朝会報告管理システム', () => {
  // SCEN-336: [edge] 日報入力バリデーション機能 - 抱えている課題が文字数制限上限ちょうどのとき入力ルールを満たす
  test('should accept challenges field with exactly 500 characters and allow submission', async () => {
    // Arrange: 抱えている課題が文字数制限上限ちょうど（500文字）のテキストを準備
    const exactlyFiveHundredChars = 'a'.repeat(500);
    
    const input = {
      userId: 'ENG001',
      teamId: 'TEAM-A',
      yesterdayAccomplishment: 'Completed API integration testing with 95% pass rate',
      todayPlan: 'Start database migration preparation and configuration backup',
      challenges: exactlyFiveHundredChars,
      reportDate: '2024-01-15'
    };

    const expectedSubmissionTimestamp = '2024-01-15T08:30:00.000Z';
    const expectedReportId = 'RPT-2024-01-15-ENG001';

    // Act: submitDailyReport を呼び出す
    const result = await submitDailyReport(input);

    // Assert: バリデーションエラーなく、送信が成功して必須フィールドが返されることを確認
    expect(result).toBeDefined();
    expect(result.reportId).toBe(expectedReportId);
    expect(result.submissionTimestamp).toBe(expectedSubmissionTimestamp);
    expect(result.isWithinDeadline).toBe(true);
    expect(result.reportId).toMatch(/^RPT-/);
    expect(result.submissionTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});