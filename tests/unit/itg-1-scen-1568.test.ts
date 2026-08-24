import { generateWeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';
import { type WeeklyAnalysisReportInput } from '../../src/logic/weekly-issue-analysis';

describe('Weekly Issue Analysis Report Generation', () => {
  // SCEN-1568: [error] 週次課題傾向レポート生成機能 - 優先度スコアデータが null のときエラーになる
  test('should throw error with PRIORITY_SCORE_NULL code when impact score is null', async () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([
        { keyword: 'バグ対応', occurrenceCount: 5 },
        { keyword: 'スケジュール遅延', occurrenceCount: 3 },
      ]),
      assessImpactScore: jest.fn().mockResolvedValue(null),
      classifyIssueSeverity: jest.fn(),
    };

    const input: WeeklyAnalysisReportInput = {
      aggregationStartDate: '2024-01-08',
      aggregationEndDate: '2024-01-14',
      extractedIssues: [
        {
          keyword: 'バグ対応',
          occurrenceCount: 5,
          impactScore: null,
        },
        {
          keyword: 'スケジュール遅延',
          occurrenceCount: 3,
          impactScore: null,
        },
      ],
      teamId: 'team-001',
    };

    try {
      await generateWeeklyAnalysisReport(input, mockTextAnalysisServiceAdapter);
      fail('Expected generateWeeklyAnalysisReport to throw an error');
    } catch (error: any) {
      expect(error.message).toMatch(/優先度スコアが未定義です/);
      expect(error.code).toBe('PRIORITY_SCORE_NULL');
      expect(error.details).toEqual({
        failedKeywords: ['バグ対応', 'スケジュール遅延'],
      });
    }
  });
});