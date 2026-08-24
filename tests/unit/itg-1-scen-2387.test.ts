import { generateWeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';
import { type WeeklyAnalysisReportInput, type WeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';

describe('Weekly Issue Analysis - Duplicate Report Handling', () => {
  test('SCEN-2387: generateWeeklyAnalysisReport deduplicates reports from same user on same date and calculates metrics correctly', async () => {
    // Setup: Mock TextAnalysisServiceAdapter
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue([
        { keyword: 'database_issue', frequency: 2 },
        { keyword: 'api_error', frequency: 1 }
      ]),
      assessImpactScore: jest.fn().mockResolvedValue({
        keyword: 'database_issue',
        impactScore: 75
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue('high')
    };

    // Prepare test data: duplicate reports (same user, same date)
    const duplicateReportData_set1 = [
      {
        issueKeyword: 'database_issue',
        occurrenceCount: 1,
        userId: 'user_001',
        reportDate: '2026-08-12'
      },
      {
        issueKeyword: 'database_issue',
        occurrenceCount: 1,
        userId: 'user_001',
        reportDate: '2026-08-12'
      },
      {
        issueKeyword: 'database_issue',
        occurrenceCount: 1,
        userId: 'user_001',
        reportDate: '2026-08-12'
      }
    ];

    // Different date reports from same user (not duplicates)
    const differentDateReportData = [
      {
        issueKeyword: 'api_error',
        occurrenceCount: 1,
        userId: 'user_001',
        reportDate: '2026-08-13'
      },
      {
        issueKeyword: 'api_error',
        occurrenceCount: 1,
        userId: 'user_001',
        reportDate: '2026-08-14'
      }
    ];

    // Additional reports from other period
    const otherReportData = [
      {
        issueKeyword: 'database_issue',
        occurrenceCount: 1,
        userId: 'user_002',
        reportDate: '2026-08-15'
      },
      {
        issueKeyword: 'database_issue',
        occurrenceCount: 1,
        userId: 'user_003',
        reportDate: '2026-08-16'
      }
    ];

    const allExtractedIssues = [
      ...duplicateReportData_set1,
      ...differentDateReportData,
      ...otherReportData
    ];

    const input: WeeklyAnalysisReportInput = {
      aggregationStartDate: '2026-08-12',
      aggregationEndDate: '2026-08-18',
      extractedIssues: allExtractedIssues,
      teamId: 'team_001'
    };

    // Execute the function with mock adapter
    const result = await generateWeeklyAnalysisReport(input, mockTextAnalysisAdapter);

    // Assertions for deduplication
    expect(result).toBeDefined();
    expect(result.reportId).toBeDefined();
    expect(result.reportId).toMatch(/^report_/);

    // Verify aggregation period
    expect(result.aggregationPeriod.startDate).toBe('2026-08-12');
    expect(result.aggregationPeriod.endDate).toBe('2026-08-18');

    // Verify that duplicate reports are counted as 1, not 3
    // Total: 1 deduplicated + 2 different dates + 2 other = 5 unique reports
    expect(result.issueRanking).toBeDefined();
    expect(Array.isArray(result.issueRanking)).toBe(true);

    // database_issue should appear in ranking
    const databaseIssueRank = result.issueRanking.find(
      issue => issue.issueKeyword === 'database_issue'
    );
    expect(databaseIssueRank).toBeDefined();
    // Occurrence should be 3 (1 deduplicated from user_001 + 1 from user_002 + 1 from user_003)
    expect(databaseIssueRank?.occurrenceCount).toBe(3);
    expect(databaseIssueRank?.rank).toBe(1);

    // api_error should appear with count 2 (different dates from user_001)
    const apiErrorRank = result.issueRanking.find(
      issue => issue.issueKeyword === 'api_error'
    );
    expect(apiErrorRank).toBeDefined();
    expect(apiErrorRank?.occurrenceCount).toBe(2);
    expect(apiErrorRank?.rank).toBe(2);

    // Verify priority scores are calculated
    expect(result.priorityScores).toBeDefined();
    expect(Array.isArray(result.priorityScores)).toBe(true);

    // At least database_issue should have a priority score entry
    const databaseIssuePriority = result.priorityScores.find(
      ps => ps.issueId && ps.issueId.includes('database_issue')
    );
    expect(databaseIssuePriority).toBeDefined();
    expect(databaseIssuePriority?.priorityScore).toBeGreaterThanOrEqual(0);
    expect(databaseIssuePriority?.priorityScore).toBeLessThanOrEqual(100);
    expect(['high', 'medium', 'low']).toContain(databaseIssuePriority?.priorityRank);

    // Verify recommended countermeasures exist
    expect(result.recommendedCountermeasures).toBeDefined();
    expect(Array.isArray(result.recommendedCountermeasures)).toBe(true);

    // Verify generated timestamp
    expect(result.generatedAt).toBeDefined();
    const generatedDate = new Date(result.generatedAt);
    expect(generatedDate.getTime()).toBeGreaterThan(0);

    // Verify mock adapter was called
    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalled();
    expect(mockTextAnalysisAdapter.assessImpactScore).toHaveBeenCalled();
  });
});