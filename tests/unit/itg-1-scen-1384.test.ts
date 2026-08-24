import { extractAndRankIssueKeywords } from '../../src/logic/issue-analysis';
import type {
  ExtractIssueKeywordsInput,
  RankedIssueKeywordList,
} from '../../src/logic/issue-analysis';

describe('Issue Analysis - Extract and Rank Keywords with Mixed Integrable/Non-Integrable Issues', () => {
  // SCEN-1384
  test('should fail with mixed integrable and non-integrable issues and log detailed error information', async () => {
    // Setup: Create mock TextAnalysisServiceAdapter
    const mockTextAnalysisService = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    // Configure mock responses for integrable issues (A and C)
    mockTextAnalysisService.extractKeywords.mockResolvedValue({
      keywords: ['DB接続'],
      frequency: 2,
    });

    mockTextAnalysisService.assessImpactScore.mockImplementation(
      async (keyword: string) => {
        if (keyword === 'DB接続') {
          return { keyword, score: 72.5 };
        }
        return { keyword, score: 30 };
      }
    );

    // Configure mock to throw for non-integrable issue (B)
    mockTextAnalysisService.classifyIssueSeverity.mockImplementation(
      async (keyword: string) => {
        if (keyword === '営業資料作成') {
          throw new Error(
            'classifyIssueSeverity failed for non-integrable issue'
          );
        }
        return { keyword, severity: 'HIGH' };
      }
    );

    // Build input data with mixed integrable and non-integrable issues
    const reportDataList = [
      {
        id: 'report-001',
        content: 'DB接続エラーが発生した',
        teamId: 'team-001',
        createdAt: '2024-01-15T09:00:00Z',
        reportedBy: 'user-001',
      },
      {
        id: 'report-002',
        content: '営業資料作成が遅延している',
        teamId: 'team-001',
        createdAt: '2024-01-15T09:15:00Z',
        reportedBy: 'user-002',
      },
      {
        id: 'report-003',
        content: 'DB接続が不安定',
        teamId: 'team-001',
        createdAt: '2024-01-15T09:30:00Z',
        reportedBy: 'user-003',
      },
    ];

    const input: ExtractIssueKeywordsInput = {
      reportDataList,
      analysisStartDate: '2024-01-08T00:00:00Z',
      analysisEndDate: '2024-01-15T23:59:59Z',
      minFrequencyThreshold: 1,
    };

    // Execute function and expect error
    await expect(
      extractAndRankIssueKeywords(input, mockTextAnalysisService)
    ).rejects.toThrow(/Mixed integrable and non-integrable issues detected/);

    // Verify that classifyIssueSeverity was called for the non-integrable issue
    expect(mockTextAnalysisService.classifyIssueSeverity).toHaveBeenCalledWith(
      '営業資料作成'
    );

    // Verify input data remains unchanged (rollback verification)
    expect(reportDataList).toHaveLength(3);
    expect(reportDataList[0].id).toBe('report-001');
    expect(reportDataList[1].id).toBe('report-002');
    expect(reportDataList[2].id).toBe('report-003');
  });
});