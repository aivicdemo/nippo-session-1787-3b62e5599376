import { generateWeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';
import type { WeeklyAnalysisReportInput } from '../../src/logic/weekly-issue-analysis';

describe('Weekly Issue Analysis Report Generation', () => {
  // SCEN-1693
  test('should return error when teamId is null during weekly analysis report generation', () => {
    const input: WeeklyAnalysisReportInput = {
      aggregationStartDate: '2024-01-08',
      aggregationEndDate: '2024-01-14',
      extractedIssues: [
        {
          issueKeyword: 'デプロイ失敗',
          occurrenceCount: 3,
          impactScore: 85,
        },
        {
          issueKeyword: 'DB接続エラー',
          occurrenceCount: 2,
          impactScore: 72,
        },
      ],
      teamId: null as any,
    };

    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    expect(() =>
      generateWeeklyAnalysisReport(input, mockTextAnalysisAdapter)
    ).toThrow(/分析対象部門ID/);

    expect(mockTextAnalysisAdapter.extractKeywords).not.toHaveBeenCalled();
    expect(mockTextAnalysisAdapter.assessImpactScore).not.toHaveBeenCalled();
    expect(mockTextAnalysisAdapter.classifyIssueSeverity).not.toHaveBeenCalled();
  });
});