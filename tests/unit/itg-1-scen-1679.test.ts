import { generateWeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';
import type { WeeklyAnalysisReportInput, WeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';

describe('Weekly Issue Analysis Report Generation', () => {
  // SCEN-1679: [error] 週次課題傾向分析レポート生成 - 分析対象日報レコード件数が負数のとき分析を中止し警告を返す
  test('should abort analysis and return warning when reportRecordCount is negative', async () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input: WeeklyAnalysisReportInput = {
      aggregationStartDate: '2024-01-08',
      aggregationEndDate: '2024-01-14',
      extractedIssues: [
        {
          issueKeyword: 'database_connection_timeout',
          occurrenceFrequency: 3,
          impactDegree: 85,
        },
        {
          issueKeyword: 'memory_leak',
          occurrenceFrequency: 2,
          impactDegree: 72,
        },
      ],
      teamId: 'team_001',
    };

    const result = await generateWeeklyAnalysisReport(
      input,
      mockTextAnalysisServiceAdapter,
      -5
    );

    expect(mockTextAnalysisServiceAdapter.extractKeywords).not.toHaveBeenCalled();
    expect(result.status).toBe('ANALYSIS_ABORTED');
    expect(result.warning).toMatch(/負数/);
  });
});