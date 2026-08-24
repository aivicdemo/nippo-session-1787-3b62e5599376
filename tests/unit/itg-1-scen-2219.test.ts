import { submitDailyReport } from '../../src/logic/daily-report-management';

describe('日報の課題項目から課題キーワードを自動抽出し、発生頻度でランク付けして表示する機能', () => {
  // SCEN-2219: [edge] 朝会報告の入力値検証機能 - 報告項目テキストが最大許容文字数ちょうどで検証に合格する
  test('報告項目テキストが最大許容文字数ちょうどのとき検証に合格する', () => {
    const maxLength = 2000;
    const exactLengthText = 'a'.repeat(maxLength);

    const input = {
      userId: 'user-001',
      teamId: 'team-001',
      yesterdayAccomplishment: exactLengthText,
      todayPlan: 'today plan',
      challenges: 'challenges',
      reportDate: '2024-01-15',
    };

    const result = submitDailyReport(input);

    expect(result.reportId).toBeDefined();
    expect(typeof result.reportId).toBe('string');
    expect(result.submissionTimestamp).toBeDefined();
    expect(typeof result.submissionTimestamp).toBe('string');
    expect(result.isWithinDeadline).toBe(true);
  });
});