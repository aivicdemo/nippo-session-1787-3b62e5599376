import { submitDailyReport } from '../../src/logic/daily-report-management';
import { type SubmitDailyReportInput, type SubmitDailyReportOutput } from '../../src/logic/daily-report-management';

describe('submitDailyReport', () => {
  // SCEN-2510: [normal] 初回テスト報告の入力検証機能 - 同じ入力データで2回検証実行しても同じ結果が返される
  test('should return identical validation results for identical inputs on two consecutive calls', () => {
    const testInput: SubmitDailyReportInput = {
      userId: 'user-001',
      teamId: 'team-001',
      yesterdayAccomplishment: '顧客A対応',
      todayPlan: '提案資料作成',
      challenges: 'API連携の遅延',
      reportDate: '2024-01-15',
    };

    const mockTextAnalysisClient = {
      extractKeywords: jest.fn().mockReturnValue({
        keywords: [
          { keyword: 'API', frequency: 1, confidence: 0.95 },
          { keyword: '連携', frequency: 1, confidence: 0.92 },
        ],
      }),
      assessImpactScore: jest.fn().mockReturnValue({
        impactScore: 75,
        affectedTeamCount: 3,
      }),
      classifyIssueSeverity: jest.fn().mockReturnValue({
        severity: 'high',
        confidenceLevel: 0.88,
      }),
    };

    const firstResult: SubmitDailyReportOutput = submitDailyReport(
      testInput,
      mockTextAnalysisClient
    );

    const secondResult: SubmitDailyReportOutput = submitDailyReport(
      testInput,
      mockTextAnalysisClient
    );

    expect(firstResult.reportId).toBe(secondResult.reportId);
    expect(firstResult.submissionTimestamp).toBe(secondResult.submissionTimestamp);
    expect(firstResult.isWithinDeadline).toBe(secondResult.isWithinDeadline);
  });
});