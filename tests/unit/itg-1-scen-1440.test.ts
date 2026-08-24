import { extractWeeklyReportData } from '../../src/logic/weekly-issue-analysis';
import { type WeeklyExtractionRequest, type WeeklyReportDataset, type DailyReportSummary } from '../../src/logic/weekly-issue-analysis';

describe('Weekly Issue Analysis - Extract Weekly Report Data', () => {
  // SCEN-1440: [normal] 前週日報データ集約機能 - 日報から「今日やること」項目を除外し、「抱えている課題」のみが構造化データとして抽出される
  test('should extract only challenge items from weekly reports, excluding yesterday and today sections', async () => {
    const weekStartDate = new Date('2024-01-08T00:00:00Z');
    const weekEndDate = new Date('2024-01-14T23:59:59Z');
    const requestedByUserId = 'user-001';
    const teamIds = ['team-alpha'];

    const mockExtractKeywords = jest.fn().mockResolvedValue({
      keywords: [
        { keyword: 'database-performance', frequency: 2, confidence: 0.95 },
        { keyword: 'api-latency', frequency: 1, confidence: 0.88 },
      ],
    });

    const mockAssessImpactScore = jest.fn().mockResolvedValue({
      impactScore: 75,
    });

    const mockTextAnalysisAdapter = {
      extractKeywords: mockExtractKeywords,
      assessImpactScore: mockAssessImpactScore,
      classifyIssueSeverity: jest.fn().mockResolvedValue({ severity: 'high' }),
    };

    const mockDailyReports = [
      {
        reportDate: new Date('2024-01-08T09:00:00Z'),
        reporterId: 'engineer-001',
        yesterday: 'Fixed login bug',
        today: 'Review PRs',
        challenges: 'Database queries are slow in production',
      },
      {
        reportDate: new Date('2024-01-09T09:00:00Z'),
        reporterId: 'engineer-002',
        yesterday: 'Completed feature X',
        today: 'Start testing feature Y',
        challenges: 'API response time exceeds SLA',
      },
      {
        reportDate: new Date('2024-01-10T09:00:00Z'),
        reporterId: 'engineer-001',
        yesterday: 'Database optimization',
        today: 'Monitor performance metrics',
        challenges: 'Database queries still causing issues',
      },
    ];

    const mockFetchDailyReports = jest.fn().mockResolvedValue(mockDailyReports);

    const request: WeeklyExtractionRequest = {
      weekStartDate,
      weekEndDate,
      teamIds,
      requestedByUserId,
    };

    const result: WeeklyReportDataset = await extractWeeklyReportData(
      request,
      {
        fetchDailyReports: mockFetchDailyReports,
        textAnalysisAdapter: mockTextAnalysisAdapter,
      }
    );

    expect(result.weekRange.startDate).toEqual(weekStartDate);
    expect(result.weekRange.endDate).toEqual(weekEndDate);
    expect(result.totalReportsExtracted).toBe(3);

    expect(result.reportsByDate).toHaveLength(3);

    const jan08Report = result.reportsByDate[0] as DailyReportSummary;
    expect(jan08Report.reportDate).toEqual(new Date('2024-01-08T09:00:00Z'));
    expect(jan08Report.reportCount).toBe(1);
    expect(jan08Report.submittedByUserIds).toContain('engineer-001');
    expect(jan08Report.challengeItems).toContain('Database queries are slow in production');
    expect(jan08Report.challengeItems).not.toContain('Fixed login bug');
    expect(jan08Report.challengeItems).not.toContain('Review PRs');

    const jan09Report = result.reportsByDate[1] as DailyReportSummary;
    expect(jan09Report.reportDate).toEqual(new Date('2024-01-09T09:00:00Z'));
    expect(jan09Report.reportCount).toBe(1);
    expect(jan09Report.submittedByUserIds).toContain('engineer-002');
    expect(jan09Report.challengeItems).toContain('API response time exceeds SLA');
    expect(jan09Report.challengeItems).not.toContain('Completed feature X');
    expect(jan09Report.challengeItems).not.toContain('Start testing feature Y');

    expect(mockExtractKeywords).toHaveBeenCalled();
    const callsWithChallenges = mockExtractKeywords.mock.calls.filter(
      (call) => call[0]?.includes('Database') || call[0]?.includes('API')
    );
    expect(callsWithChallenges.length).toBeGreaterThan(0);

    const allCallArgs = mockExtractKeywords.mock.calls.map((call) => call[0]);
    expect(allCallArgs).toContain('Database queries are slow in production');
    expect(allCallArgs).toContain('API response time exceeds SLA');
    expect(allCallArgs).toContain('Database queries still causing issues');
    expect(allCallArgs.some((arg) => arg?.includes('Fixed login bug'))).toBe(false);
    expect(allCallArgs.some((arg) => arg?.includes('Review PRs'))).toBe(false);

    expect(result.extractedChallenges).toBeDefined();
    expect(Array.isArray(result.extractedChallenges)).toBe(true);

    expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);
  });
});