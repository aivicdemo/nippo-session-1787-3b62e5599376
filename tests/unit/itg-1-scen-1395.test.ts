import { extractAndRankIssueKeywords } from '../../src/logic/issue-analysis';

describe('Issue Analysis - Extract and Rank Keywords with Duplicate Detection', () => {
  // SCEN-1395
  test('should merge completely duplicate report records into a single ranked keyword entry', () => {
    // Prepare test data: 3 records with identical content
    const duplicateReportData = [
      {
        id: 'report-001',
        userId: 'user-001',
        teamId: 'team-001',
        yesterday: 'Completed API integration testing',
        today: 'Deploy to staging environment',
        challenges: 'Database performance bottleneck in query optimization',
        submittedAt: '2024-01-15T09:30:00Z',
        contentHash: 'hash-abc123',
      },
      {
        id: 'report-002',
        userId: 'user-002',
        teamId: 'team-001',
        yesterday: 'Completed API integration testing',
        today: 'Deploy to staging environment',
        challenges: 'Database performance bottleneck in query optimization',
        submittedAt: '2024-01-15T09:35:00Z',
        contentHash: 'hash-abc123',
      },
      {
        id: 'report-003',
        userId: 'user-003',
        teamId: 'team-001',
        yesterday: 'Completed API integration testing',
        today: 'Deploy to staging environment',
        challenges: 'Database performance bottleneck in query optimization',
        submittedAt: '2024-01-15T09:40:00Z',
        contentHash: 'hash-abc123',
      },
    ];

    // Create stub for TextAnalysisServiceAdapter
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn((text: string) => {
        // Simulate keyword extraction from challenge text
        if (text.includes('Database performance bottleneck')) {
          return {
            keywords: ['database', 'performance', 'bottleneck', 'query', 'optimization'],
            frequency: 3,
          };
        }
        return { keywords: [], frequency: 0 };
      }),
      assessImpactScore: jest.fn((keyword: string) => {
        if (keyword === 'database' || keyword === 'performance') {
          return 85;
        }
        return 60;
      }),
      classifyIssueSeverity: jest.fn((text: string) => 'HIGH'),
    };

    // Input parameters
    const input = {
      reportDataList: duplicateReportData,
      analysisStartDate: '2024-01-15T00:00:00Z',
      analysisEndDate: '2024-01-15T23:59:59Z',
      minFrequencyThreshold: 1,
    };

    // Execute function
    const result = extractAndRankIssueKeywords(input, mockTextAnalysisServiceAdapter);

    // Verify that duplicate records are merged into single keyword entry
    expect(result.keywords).toBeDefined();
    expect(Array.isArray(result.keywords)).toBe(true);

    // Should contain merged keyword entries (not tripled)
    const databaseKeywordEntry = result.keywords.find(
      (kw) => kw.keyword === 'database' || kw.keyword === 'performance'
    );
    expect(databaseKeywordEntry).toBeDefined();

    // Frequency should reflect 3 duplicate occurrences merged into single entry
    expect(databaseKeywordEntry?.frequency).toBe(3);

    // Priority score should be calculated from merged data
    expect(databaseKeywordEntry?.priorityScore).toBeGreaterThan(0);
    expect(databaseKeywordEntry?.priorityScore).toBeLessThanOrEqual(100);

    // Priority color should be assigned based on score
    expect(['red', 'yellow', 'green']).toContain(databaseKeywordEntry?.priorityColor);

    // Total issue count should reflect merged records (1 unique issue from 3 duplicates)
    expect(result.totalIssueCount).toBe(3); // 3 reports, but 1 unique challenge content

    // Analysis executed timestamp should be set
    expect(result.analysisExecutedAt).toBeDefined();
    const analysisTime = new Date(result.analysisExecutedAt);
    expect(analysisTime.getTime()).toBeGreaterThan(0);

    // Data quality score should be valid
    expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);

    // Verify mock was called to extract keywords from challenge text
    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalled();

    // Verify that the identical challenge text was processed
    const challengeTexts = duplicateReportData.map((r) => r.challenges);
    const uniqueChallengeTexts = new Set(challengeTexts);
    expect(uniqueChallengeTexts.size).toBe(1);

    // Verify priority score calculation includes impact score from adapter
    expect(mockTextAnalysisServiceAdapter.assessImpactScore).toHaveBeenCalledWith('database');
  });
});