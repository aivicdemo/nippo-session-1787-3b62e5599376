import { extractAndRankIssueKeywords } from '../../src/logic/issue-analysis';
import { type ExtractIssueKeywordsInput, type RankedIssueKeywordList } from '../../src/logic/issue-analysis';

describe('Issue Analysis - Extract and Rank Keywords with Impact Score Validation', () => {
  // SCEN-1376
  test('should fail priority score calculation when impact score is negative', async () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ['database_performance', 'api_timeout'],
        frequencies: [5, 3],
      }),
      assessImpactScore: jest.fn().mockResolvedValue(-15),
      classifyIssueSeverity: jest.fn().mockResolvedValue('HIGH'),
    };

    const reportDataList = [
      {
        id: 'report_001',
        teamId: 'team_001',
        reportedAt: '2024-01-15T09:00:00Z',
        issueContent: 'Database connection timeout occurred multiple times',
        yesterdayAccomplishments: 'Fixed UI bugs',
        todayPlan: 'Deploy new API',
      },
      {
        id: 'report_002',
        teamId: 'team_001',
        reportedAt: '2024-01-15T09:15:00Z',
        issueContent: 'Database performance degradation affecting API responses',
        yesterdayAccomplishments: 'Reviewed PR',
        todayPlan: 'Optimize queries',
      },
    ];

    const input: ExtractIssueKeywordsInput = {
      reportDataList,
      analysisStartDate: '2024-01-08T00:00:00Z',
      analysisEndDate: '2024-01-15T23:59:59Z',
      minFrequencyThreshold: 1,
    };

    let thrownError: Error | null = null;

    try {
      await extractAndRankIssueKeywords(input, mockTextAnalysisServiceAdapter);
    } catch (error) {
      thrownError = error as Error;
    }

    expect(thrownError).not.toBeNull();
    expect(thrownError?.message).toMatch(/Impact score must be a non-negative value/);
  });
});