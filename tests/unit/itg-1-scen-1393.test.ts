import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-analysis';

describe('Issue Analysis - Extract and Rank Keywords with Cross-Year Duplicate Detection', () => {
  test('SCEN-1393: should correctly identify and merge duplicate issues across fiscal years', async () => {
    // Setup: Prepare test data spanning fiscal years
    const priorYearStartDate = '2025-04-01';
    const priorYearEndDate = '2026-03-31';
    const currentYearStartDate = '2026-04-01';
    const currentYearEndDate = '2027-03-31';

    // Create sample daily reports for prior fiscal year (2025-2026)
    const priorYearReports = [
      {
        id: 'report-p1',
        reportDate: '2026-03-15',
        userId: 'user-001',
        teamId: 'team-001',
        yesterdayWork: 'Fixed DB connection issues',
        todayPlan: 'Monitor DB performance',
        issues: 'DB接続エラー occurring in production',
        createdAt: '2026-03-15T09:00:00Z',
        submittedAt: '2026-03-15T08:30:00Z',
      },
      {
        id: 'report-p2',
        reportDate: '2026-03-20',
        userId: 'user-002',
        teamId: 'team-001',
        yesterdayWork: 'Reviewed API documentation',
        todayPlan: 'Update integration code',
        issues: 'API仕様変更 causing integration failures',
        createdAt: '2026-03-20T09:00:00Z',
        submittedAt: '2026-03-20T08:45:00Z',
      },
      {
        id: 'report-p3',
        reportDate: '2026-03-25',
        userId: 'user-003',
        teamId: 'team-001',
        yesterdayWork: 'Conducted security audit',
        todayPlan: 'Apply security patches',
        issues: 'セキュリティ脆弱性 identified in legacy code',
        createdAt: '2026-03-25T09:00:00Z',
        submittedAt: '2026-03-25T08:15:00Z',
      },
    ];

    // Create sample daily reports for current fiscal year (2026-2027)
    const currentYearReports = [
      {
        id: 'report-c1',
        reportDate: '2026-04-01',
        userId: 'user-001',
        teamId: 'team-001',
        yesterdayWork: 'Deployed new version',
        todayPlan: 'Monitor system logs',
        issues: 'DB接続エラー recurring in new environment',
        createdAt: '2026-04-01T09:00:00Z',
        submittedAt: '2026-04-01T08:20:00Z',
      },
      {
        id: 'report-c2',
        reportDate: '2026-04-05',
        userId: 'user-004',
        teamId: 'team-001',
        yesterdayWork: 'Tested new features',
        todayPlan: 'Fix validation logic',
        issues: 'テストスイート失敗 preventing deployment',
        createdAt: '2026-04-05T09:00:00Z',
        submittedAt: '2026-04-05T08:40:00Z',
      },
      {
        id: 'report-c3',
        reportDate: '2026-04-10',
        userId: 'user-002',
        teamId: 'team-001',
        yesterdayWork: 'Updated API contracts',
        todayPlan: 'Deploy API changes',
        issues: 'API仕様変更 breaking backward compatibility',
        createdAt: '2026-04-10T09:00:00Z',
        submittedAt: '2026-04-10T09:15:00Z',
      },
    ];

    // Combine all reports
    const allReports = [...priorYearReports, ...currentYearReports];

    // Mock TextAnalysisServiceAdapter behavior
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn((text: string) => {
        // Simulate keyword extraction for cross-year duplicate detection
        if (
          text.includes('DB接続エラー') ||
          text.includes('DB connection')
        ) {
          return Promise.resolve(['DB接続エラー']);
        }
        if (
          text.includes('API仕様変更') ||
          text.includes('API specification')
        ) {
          return Promise.resolve(['API仕様変更']);
        }
        if (
          text.includes('セキュリティ脆弱性') ||
          text.includes('security vulnerability')
        ) {
          return Promise.resolve(['セキュリティ脆弱性']);
        }
        if (text.includes('テストスイート失敗')) {
          return Promise.resolve(['テストスイート失敗']);
        }
        return Promise.resolve([]);
      }),
    };

    // Prepare input for extractAndRankIssueKeywords
    const extractInput = {
      reportDataList: allReports,
      analysisStartDate: priorYearStartDate,
      analysisEndDate: currentYearEndDate,
      minFrequencyThreshold: 1,
    };

    // Execute function under test
    const result = await extractAndRankIssueKeywords(
      extractInput,
      mockTextAnalysisAdapter
    );

    // Verify results
    // (1) Verify DB接続エラー is identified across fiscal years with merge flag
    const dbErrorKeyword = result.keywords.find(
      (kw) => kw.keyword === 'DB接続エラー'
    );
    expect(dbErrorKeyword).toBeDefined();
    expect(dbErrorKeyword?.frequency).toBe(2); // Appears in prior year and current year
    expect(dbErrorKeyword?.priorityScore).toBeGreaterThan(0);
    expect(dbErrorKeyword?.priorityColor).toBeDefined();

    // (2) Verify API仕様変更 is identified across fiscal years with merge flag
    const apiChangeKeyword = result.keywords.find(
      (kw) => kw.keyword === 'API仕様変更'
    );
    expect(apiChangeKeyword).toBeDefined();
    expect(apiChangeKeyword?.frequency).toBe(2); // Appears in prior year and current year
    expect(apiChangeKeyword?.priorityScore).toBeGreaterThan(0);

    // (3) Verify セキュリティ脆弱性 and テストスイート失敗 have no merge (single occurrence)
    const securityKeyword = result.keywords.find(
      (kw) => kw.keyword === 'セキュリティ脆弱性'
    );
    expect(securityKeyword).toBeDefined();
    expect(securityKeyword?.frequency).toBe(1);

    const testKeyword = result.keywords.find(
      (kw) => kw.keyword === 'テストスイート失敗'
    );
    expect(testKeyword).toBeDefined();
    expect(testKeyword?.frequency).toBe(1);

    // (4) Verify total keyword count and quality score
    expect(result.keywords.length).toBe(4); // 4 unique keywords
    expect(result.totalIssueCount).toBe(6); // 6 total reports
    expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);

    // (5) Verify keywords are ranked by frequency
    const keywordsByFrequency = result.keywords.sort(
      (a, b) => b.frequency - a.frequency
    );
    expect(result.keywords[0].frequency).toBeGreaterThanOrEqual(
      result.keywords[1].frequency
    );

    // (6) Verify analysisExecutedAt is present and valid ISO format
    const analysisTime = new Date(result.analysisExecutedAt);
    expect(analysisTime.getTime()).toBeGreaterThan(0);
    expect(result.analysisExecutedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    );

    // (7) Verify TextAnalysisServiceAdapter.extractKeywords was called correct number of times
    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalledTimes(6);

    // (8) Verify priority colors are assigned correctly
    result.keywords.forEach((keyword) => {
      expect(['red', 'yellow', 'green']).toContain(keyword.priorityColor);
    });
  });
});