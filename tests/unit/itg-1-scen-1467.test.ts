import { extractWeeklyReportData } from '../../src/logic/weekly-issue-analysis';
import { type WeeklyExtractionRequest, type WeeklyReportDataset, type DailyReportSummary } from '../../src/logic/weekly-issue-analysis';

describe('Weekly Issue Analysis - extractWeeklyReportData', () => {
  test('SCEN-1467: Extract weekly report data for 9 team members and verify aggregation results', () => {
    // Arrange: Prepare test data for 9 team members' reports from previous week
    const weekStartDate = new Date('2024-01-08T00:00:00Z');
    const weekEndDate = new Date('2024-01-14T23:59:59Z');
    const teamIds = ['team-alpha'];
    const requestedByUserId = 'user-manager-001';

    const extractionRequest: WeeklyExtractionRequest = {
      weekStartDate,
      weekEndDate,
      teamIds,
      requestedByUserId,
    };

    // Mock TextAnalysisServiceAdapter with stub implementation
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn((text: string) => {
        return {
          keywords: [
            { keyword: 'database_issue', frequency: 2, confidence: 0.92 },
            { keyword: 'api_latency', frequency: 1, confidence: 0.85 },
          ],
        };
      }),
      assessImpactScore: jest.fn((keyword: string) => {
        if (keyword === 'database_issue') return 78;
        if (keyword === 'api_latency') return 65;
        return 50;
      }),
    };

    // Prepare aggregated report data for 9 team members
    const dailyReportSummaries: DailyReportSummary[] = [
      {
        reportDate: new Date('2024-01-08T09:00:00Z'),
        reportCount: 9,
        submittedByUserIds: [
          'user-engineer-001',
          'user-engineer-002',
          'user-engineer-003',
          'user-engineer-004',
          'user-engineer-005',
          'user-engineer-006',
          'user-engineer-007',
          'user-engineer-008',
          'user-engineer-009',
        ],
        challengeItems: [
          'Database connection timeout during peak hours',
          'API response time degradation',
          'Database query optimization needed',
          'Caching layer needs review',
          'Load balancer configuration issue',
          'Network latency between services',
          'Database connection pool exhaustion',
          'Query performance regression',
          'API timeout on batch operations',
        ],
      },
      {
        reportDate: new Date('2024-01-09T09:00:00Z'),
        reportCount: 9,
        submittedByUserIds: [
          'user-engineer-001',
          'user-engineer-002',
          'user-engineer-003',
          'user-engineer-004',
          'user-engineer-005',
          'user-engineer-006',
          'user-engineer-007',
          'user-engineer-008',
          'user-engineer-009',
        ],
        challengeItems: [
          'Continued database issues',
          'API latency persists',
          'Cache invalidation problems',
          'Database performance degradation',
          'Third-party service integration delay',
          'Deployment pipeline failure',
          'Database replication lag',
          'API rate limiting triggered',
          'Connection timeout errors',
        ],
      },
    ];

    // Act: Call extractWeeklyReportData with the prepared request
    const result: WeeklyReportDataset = extractWeeklyReportData(
      extractionRequest,
      mockTextAnalysisAdapter,
      dailyReportSummaries
    );

    // Assert: Verify aggregation results match the 9 team members
    expect(result.totalReportsExtracted).toBe(9);
    expect(result.reportsByDate).toHaveLength(2);
    expect(result.reportsByDate[0].submittedByUserIds).toHaveLength(9);
    expect(result.reportsByDate[1].submittedByUserIds).toHaveLength(9);

    // Assert: Verify each daily report summary contains required fields
    result.reportsByDate.forEach((dailySummary) => {
      expect(dailySummary.reportDate).toBeInstanceOf(Date);
      expect(typeof dailySummary.reportCount).toBe('number');
      expect(dailySummary.reportCount).toBeGreaterThan(0);
      expect(Array.isArray(dailySummary.submittedByUserIds)).toBe(true);
      expect(Array.isArray(dailySummary.challengeItems)).toBe(true);
      expect(dailySummary.submittedByUserIds.length).toBe(9);
    });

    // Assert: Verify extracted challenges contain normalized and deduplicated issues
    expect(result.extractedChallenges).toBeDefined();
    expect(Array.isArray(result.extractedChallenges)).toBe(true);
    expect(result.extractedChallenges.length).toBeGreaterThan(0);

    // Assert: Verify data quality score is within valid range
    expect(typeof result.dataQualityScore).toBe('number');
    expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);

    // Assert: Verify week range is correctly set
    expect(result.weekRange.startDate).toEqual(weekStartDate);
    expect(result.weekRange.endDate).toEqual(weekEndDate);

    // Assert: Verify mock adapter was called with expected keywords
    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalled();
    expect(mockTextAnalysisAdapter.assessImpactScore).toHaveBeenCalled();

    // Assert: Verify each extracted challenge contains required impact score
    result.extractedChallenges.forEach((challenge) => {
      expect(typeof challenge.keyword).toBe('string');
      expect(typeof challenge.frequency).toBe('number');
      expect(challenge.frequency).toBeGreaterThanOrEqual(1);
      if (challenge.impactScore !== undefined) {
        expect(typeof challenge.impactScore).toBe('number');
        expect(challenge.impactScore).toBeGreaterThanOrEqual(0);
        expect(challenge.impactScore).toBeLessThanOrEqual(100);
      }
    });

    // Assert: Verify total challenge count across all daily summaries
    const totalChallengeItems = result.reportsByDate.reduce(
      (sum, daily) => sum + daily.challengeItems.length,
      0
    );
    expect(totalChallengeItems).toBe(18); // 9 items per day × 2 days
  });
});