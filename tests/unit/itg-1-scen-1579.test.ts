import { generateWeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';
import { type WeeklyAnalysisReportInput, type WeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';

describe('Weekly Issue Analysis Report Generation - Priority Score Validation', () => {
  // SCEN-1579: [error] 週次課題傾向レポート生成機能 - 優先度スコアが負の数のときエラーになる
  test('should reject report generation when priority score is negative', async () => {
    const mockTextAnalysisService = {
      extractKeywords: jest.fn().mockResolvedValue([
        {
          keyword: 'ネットワーク遅延',
          occurrenceCount: 3,
          confidenceScore: 0.85,
        },
      ]),
      assessImpactScore: jest.fn().mockResolvedValue(-5),
      classifyIssueSeverity: jest.fn().mockResolvedValue('high'),
    };

    const input: WeeklyAnalysisReportInput = {
      aggregationStartDate: '2024-01-08',
      aggregationEndDate: '2024-01-14',
      extractedIssues: [
        {
          keyword: 'ネットワーク遅延',
          occurrenceCount: 3,
          impactScore: 0,
        },
      ],
      teamId: 'team-001',
    };

    await expect(
      generateWeeklyAnalysisReport(input, mockTextAnalysisService)
    ).rejects.toThrow(/優先度スコア/);
  });
});