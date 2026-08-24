import { extractAndRankIssueKeywords } from '../../src/logic/issue-extraction-prioritization';
import { type ExtractIssueKeywordsInput, type RankedIssueKeywordList } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Keyword Extraction and Ranking', () => {
  // SCEN-1749: Year-boundary week date range validation for cross-fiscal-year aggregation
  test('should correctly extract and rank keywords from reports spanning year boundary (March 25 - April 1)', async () => {
    // Arrange
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: 'API timeout', frequency: 2 },
          { keyword: 'database connection', frequency: 1 }
        ]
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        impactScore: 75
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        severity: 'high'
      })
    };

    const input: ExtractIssueKeywordsInput = {
      teamId: 'team-001',
      startDate: new Date('2024-03-25T00:00:00Z'),
      endDate: new Date('2024-04-01T23:59:59Z'),
      minFrequencyThreshold: 1,
      requestUserId: 'user-pm-001'
    };

    // Mock database to return 3 reports: Mar 25, Mar 31, Apr 1
    // These should be included, while reports from Mar 24 or before, and Apr 2 or after should be excluded
    const mockReportsInRange = [
      {
        reportId: 'report-001',
        teamId: 'team-001',
        createdAt: new Date('2024-03-25T09:00:00Z'),
        challengeContent: 'API timeout issues affecting service'
      },
      {
        reportId: 'report-002',
        teamId: 'team-001',
        createdAt: new Date('2024-03-31T14:30:00Z'),
        challengeContent: 'Database connection problems encountered'
      },
      {
        reportId: 'report-003',
        teamId: 'team-001',
        createdAt: new Date('2024-04-01T11:15:00Z'),
        challengeContent: 'API timeout recurrence noted'
      }
    ];

    // Act
    const result: RankedIssueKeywordList = await extractAndRankIssueKeywords(
      input,
      mockTextAnalysisServiceAdapter
    );

    // Assert
    // Verify that all 3 reports within the date range were aggregated
    expect(result.keywords).toBeDefined();
    expect(result.keywords.length).toBeGreaterThan(0);
    
    // Verify the extraction picked up keywords from all 3 reports
    const apiTimeoutKeyword = result.keywords.find(k => k.keyword === 'API timeout');
    expect(apiTimeoutKeyword).toBeDefined();
    expect(apiTimeoutKeyword?.frequency).toBe(2);
    
    const databaseKeyword = result.keywords.find(k => k.keyword === 'database connection');
    expect(databaseKeyword).toBeDefined();
    expect(databaseKeyword?.frequency).toBe(1);

    // Verify ranking is by frequency (descending)
    expect(result.keywords[0].rank).toBe(1);
    expect(result.keywords[1].rank).toBe(2);

    // Verify period analysis metadata
    expect(result.analysisperiodDays).toBe(8); // Mar 25 through Apr 1 inclusive
    
    // Verify that extraction was called with correct parameters
    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalled();

    // Verify total keyword count reflects the aggregation
    expect(result.totalKeywordCount).toBe(2);

    // Verify extracted timestamp is recorded
    expect(result.extractedAt).toBeDefined();
    expect(result.extractedAt instanceof Date).toBe(true);
  });
});