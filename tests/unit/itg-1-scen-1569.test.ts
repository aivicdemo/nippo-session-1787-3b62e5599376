import { generateWeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';
import { type WeeklyAnalysisReportInput } from '../../src/logic/weekly-issue-analysis';

describe('週次課題傾向レポート生成機能 - 優先度スコアデータ検証', () => {
  // SCEN-1569
  test('優先度スコアデータが空配列のときValidationErrorが発生する', () => {
    const reportInput: WeeklyAnalysisReportInput = {
      aggregationStartDate: '2024-01-01',
      aggregationEndDate: '2024-01-07',
      extractedIssues: [
        {
          issueKeyword: 'database_timeout',
          occurrenceCount: 5,
          impactScore: 0,
          confidenceScore: 0.92,
        },
      ],
      teamId: 'team-001',
    };

    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([
        { keyword: 'database_timeout', frequency: 5 },
      ]),
      assessImpactScore: jest.fn().mockResolvedValue([]),
      classifyIssueSeverity: jest.fn().mockResolvedValue([]),
    };

    expect(() =>
      generateWeeklyAnalysisReport(reportInput, mockTextAnalysisServiceAdapter),
    ).toThrow(/ValidationError/);

    try {
      generateWeeklyAnalysisReport(
        reportInput,
        mockTextAnalysisServiceAdapter,
      );
    } catch (error: unknown) {
      if (error instanceof Error) {
        expect(error.message).toMatch(/優先度スコアデータが空/);
        if ('code' in error) {
          expect((error as { code: string }).code).toBe(
            'ERR_EMPTY_PRIORITY_SCORES',
          );
        }
      }
    }
  });
});