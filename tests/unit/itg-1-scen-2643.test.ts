import { submitDailyReport } from '../../src/logic/daily-report-management';
import { type SubmitDailyReportInput, type SubmitDailyReportOutput } from '../../src/logic/daily-report-management';

describe('Daily Report Management - Impact Score Validation', () => {
  // SCEN-2643: [error] 初回テスト報告入力検証機能 - 課題の影響度スコアが算出されていないとき不合格判定となる
  test('should reject report submission when impact score calculation returns null', async () => {
    const testInput: SubmitDailyReportInput = {
      userId: 'test-engineer-001',
      teamId: 'team-dev-001',
      yesterdayAccomplishment: 'Completed API integration for user authentication module',
      todayPlan: 'Begin testing of authentication flow and bug fixing',
      challenges: 'Encountered timeout issues in database connection pool configuration',
      reportDate: '2024-01-15',
    };

    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: 'database', frequency: 2 },
          { keyword: 'timeout', frequency: 1 },
        ],
      }),
      assessImpactScore: jest.fn().mockResolvedValue(null),
      classifyIssueSeverity: jest.fn().mockResolvedValue('medium'),
    };

    const error = await submitDailyReport(testInput, mockTextAnalysisServiceAdapter).catch(
      (err: Error) => err,
    );

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toMatch(/影響度スコア/);
  });
});