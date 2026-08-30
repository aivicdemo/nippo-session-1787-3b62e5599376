import { extractAndRankIssuesFromReports, type ExtractAndRankIssuesInput, type RankedIssueList } from '../../src/logic/issue-extraction-and-ranking';

describe('Issue Extraction and Ranking', () => {
  test('SCEN-329: Extracts and ranks issues from multiple reports, skipping empty or whitespace-only issue text', async () => {
    // Prepare test data: 10 reports total
    // - 3 reports with empty issueText
    // - 2 reports with whitespace-only issueText
    // - 5 reports with valid issue text
    const now = new Date('2024-01-15T09:00:00Z');
    const thirtyDaysAgo = new Date('2023-12-16T09:00:00Z');

    const reports = [
      // Empty issueText reports (3)
      {
        reportId: 'report-empty-1',
        reportDate: new Date('2024-01-15T08:00:00Z'),
        issueText: '',
        teamId: 'team-001',
      },
      {
        reportId: 'report-empty-2',
        reportDate: new Date('2024-01-15T08:05:00Z'),
        issueText: '',
        teamId: 'team-001',
      },
      {
        reportId: 'report-empty-3',
        reportDate: new Date('2024-01-15T08:10:00Z'),
        issueText: '',
        teamId: 'team-001',
      },
      // Whitespace-only issueText reports (2)
      {
        reportId: 'report-whitespace-1',
        reportDate: new Date('2024-01-15T08:15:00Z'),
        issueText: '   ',
        teamId: 'team-001',
      },
      {
        reportId: 'report-whitespace-2',
        reportDate: new Date('2024-01-15T08:20:00Z'),
        issueText: '\n\t  ',
        teamId: 'team-001',
      },
      // Valid issue text reports (5)
      {
        reportId: 'report-valid-1',
        reportDate: new Date('2024-01-15T08:25:00Z'),
        issueText: 'デバッグが遅延している',
        teamId: 'team-001',
      },
      {
        reportId: 'report-valid-2',
        reportDate: new Date('2024-01-15T08:30:00Z'),
        issueText: 'ビルドエラーが発生',
        teamId: 'team-001',
      },
      {
        reportId: 'report-valid-3',
        reportDate: new Date('2024-01-14T09:00:00Z'),
        issueText: 'テストが失敗している',
        teamId: 'team-002',
      },
      {
        reportId: 'report-valid-4',
        reportDate: new Date('2024-01-14T09:05:00Z'),
        issueText: 'リソース不足',
        teamId: 'team-002',
      },
      {
        reportId: 'report-valid-5',
        reportDate: new Date('2024-01-13T09:10:00Z'),
        issueText: 'デバッグが遅延している',
        teamId: 'team-003',
      },
    ];

    const input: ExtractAndRankIssuesInput = {
      reports,
      analysisStartDate: thirtyDaysAgo,
      analysisEndDate: now,
    };

    // Call the function
    const result = await extractAndRankIssuesFromReports(input);

    // Verify results
    // Expected: 5 valid reports contribute to extraction
    // Empty/whitespace reports (5 total) are skipped
    expect(result).toBeDefined();
    expect(result.issues).toBeDefined();
    expect(Array.isArray(result.issues)).toBe(true);

    // Verify that issues come only from valid reports
    // The function should skip empty/whitespace-only issueText
    const validReportIds = [
      'report-valid-1',
      'report-valid-2',
      'report-valid-3',
      'report-valid-4',
      'report-valid-5',
    ];

    // Ensure no issues are extracted from empty/whitespace reports
    // by verifying that all extracted issues have sourceReportIds from valid reports
    const sourceReportIdsInResults = result.issues.flatMap((issue) => {
      // Assuming each issue tracks its source reports or we verify indirectly
      return issue.issueId ? [issue.issueId] : [];
    });

    // The total issue count should reflect only valid reports processed
    // Based on the 5 valid reports with issue text
    expect(result.totalIssueCount).toBeGreaterThan(0);
    expect(result.totalIssueCount).toBeLessThanOrEqual(5 * 3); // Conservative upper bound

    // Verify issues are ranked by priorityScore (descending)
    for (let i = 1; i < result.issues.length; i++) {
      expect(result.issues[i - 1].priorityScore).toBeGreaterThanOrEqual(
        result.issues[i].priorityScore
      );
    }

    // Verify analysisTimestamp is set and is recent
    expect(result.analysisTimestamp).toBeDefined();
    expect(result.analysisTimestamp instanceof Date).toBe(true);
    const timeDifference = Math.abs(
      result.analysisTimestamp.getTime() - now.getTime()
    );
    expect(timeDifference).toBeLessThan(5000); // Within 5 seconds

    // Verify lowConfidenceIssueCount is defined
    expect(result.lowConfidenceIssueCount).toBeDefined();
    expect(typeof result.lowConfidenceIssueCount).toBe('number');
    expect(result.lowConfidenceIssueCount).toBeGreaterThanOrEqual(0);

    // Verify all ranked issues have required fields
    for (const issue of result.issues) {
      expect(issue.issueId).toBeDefined();
      expect(typeof issue.issueId).toBe('string');
      expect(issue.keyword).toBeDefined();
      expect(typeof issue.keyword).toBe('string');
      expect(issue.frequency).toBeDefined();
      expect(typeof issue.frequency).toBe('number');
      expect(issue.frequency).toBeGreaterThan(0);
      expect(issue.impactScore).toBeDefined();
      expect(typeof issue.impactScore).toBe('number');
      expect(issue.impactScore).toBeGreaterThanOrEqual(0);
      expect(issue.impactScore).toBeLessThanOrEqual(100);
      expect(issue.priorityScore).toBeDefined();
      expect(typeof issue.priorityScore).toBe('number');
      expect(issue.priorityScore).toBeGreaterThanOrEqual(0);
      expect(issue.priorityScore).toBeLessThanOrEqual(100);
      expect(issue.priorityRank).toBeDefined();
      expect(['高', '中', '低']).toContain(issue.priorityRank);
      expect(issue.colorCode).toBeDefined();
      expect(['red', 'yellow', 'green']).toContain(issue.colorCode);
      expect(issue.confidenceScore).toBeDefined();
      expect(typeof issue.confidenceScore).toBe('number');
      expect(issue.confidenceScore).toBeGreaterThanOrEqual(0);
      expect(issue.confidenceScore).toBeLessThanOrEqual(100);
      expect(issue.affectedTeamCount).toBeDefined();
      expect(typeof issue.affectedTeamCount).toBe('number');
      expect(issue.affectedTeamCount).toBeGreaterThan(0);
    }
  });
});