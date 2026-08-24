import { extractWeeklyReportData } from '../../src/logic/weekly-issue-analysis';
import { type WeeklyExtractionRequest, type WeeklyReportDataset, type DailyReportSummary } from '../../src/logic/weekly-issue-analysis';

describe('Weekly Report Data Extraction - Year Boundary Handling', () => {
  // SCEN-1475: [edge] 前週日報データ集約・課題抽出機能 - 集約対象期間が年度をまたぐ場合（例：前年12月30日～翌年1月5日）、両年度のデータが正しく集約される
  test('should aggregate report data correctly when extraction period spans across year boundary (2023-12-30 to 2024-01-05)', async () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn((text: string) => {
        // Mock keywords extraction
        if (text.includes('サーバー障害')) {
          return Promise.resolve([
            { keyword: 'サーバー障害', frequency: 1, confidence: 0.95 }
          ]);
        }
        if (text.includes('ネットワーク遅延')) {
          return Promise.resolve([
            { keyword: 'ネットワーク遅延', frequency: 1, confidence: 0.88 }
          ]);
        }
        if (text.includes('データベース接続')) {
          return Promise.resolve([
            { keyword: 'データベース接続', frequency: 1, confidence: 0.92 }
          ]);
        }
        return Promise.resolve([]);
      }),
      assessImpactScore: jest.fn((keyword: string) => {
        const impactMap: Record<string, number> = {
          'サーバー障害': 85,
          'ネットワーク遅延': 65,
          'データベース接続': 75
        };
        return Promise.resolve(impactMap[keyword] || 50);
      })
    };

    // Prepare mock report data spanning year boundary
    const mockReportsYearStart = [
      {
        reportDate: new Date('2023-12-30T09:00:00Z'),
        reporterId: 'user-001',
        yesterday: 'Fixed authentication issue',
        today: 'Deploy new version',
        challenges: 'サーバー障害 in production environment'
      },
      {
        reportDate: new Date('2023-12-30T09:15:00Z'),
        reporterId: 'user-002',
        yesterday: 'Tested API endpoints',
        today: 'Review code changes',
        challenges: 'ネットワーク遅延 affecting tests'
      },
      {
        reportDate: new Date('2023-12-31T09:00:00Z'),
        reporterId: 'user-003',
        yesterday: 'Implemented feature X',
        today: 'Write documentation',
        challenges: 'データベース接続 timeout issues'
      },
      {
        reportDate: new Date('2023-12-31T09:30:00Z'),
        reporterId: 'user-004',
        yesterday: 'Reviewed PRs',
        today: 'Merge stable branch',
        challenges: 'サーバー障害 persisting'
      },
      {
        reportDate: new Date('2023-12-31T10:00:00Z'),
        reporterId: 'user-005',
        yesterday: 'Updated dependencies',
        today: 'Run regression tests',
        challenges: 'ネットワーク遅延 in CI pipeline'
      }
    ];

    const mockReportsYearEnd = [
      {
        reportDate: new Date('2024-01-01T09:00:00Z'),
        reporterId: 'user-001',
        yesterday: 'Holiday break',
        today: 'Resume work',
        challenges: 'サーバー障害 still unresolved'
      },
      {
        reportDate: new Date('2024-01-02T09:00:00Z'),
        reporterId: 'user-002',
        yesterday: 'Prepared release notes',
        today: 'Execute release plan',
        challenges: 'データベース接続 pool exhausted'
      },
      {
        reportDate: new Date('2024-01-03T09:00:00Z'),
        reporterId: 'user-003',
        yesterday: 'Monitored production',
        today: 'Apply hotfix',
        challenges: 'サーバー障害 detected in logs'
      },
      {
        reportDate: new Date('2024-01-04T09:00:00Z'),
        reporterId: 'user-004',
        yesterday: 'Conducted postmortem',
        today: 'Implement prevention measures',
        challenges: 'ネットワーク遅延 in East region'
      },
      {
        reportDate: new Date('2024-01-05T09:00:00Z'),
        reporterId: 'user-005',
        yesterday: 'Deployed fixes',
        today: 'Verify metrics',
        challenges: 'Minor issues resolved'
      }
    ];

    const allMockReports = [...mockReportsYearStart, ...mockReportsYearEnd];

    // Create extraction request spanning year boundary
    const extractionRequest: WeeklyExtractionRequest = {
      weekStartDate: new Date('2023-12-30T00:00:00Z'),
      weekEndDate: new Date('2024-01-05T23:59:59Z'),
      teamIds: undefined,
      requestedByUserId: 'manager-001'
    };

    // Mock database query to return reports spanning year boundary
    const mockDatabaseAdapter = {
      getReportsByDateRange: jest.fn(async (startDate: Date, endDate: Date) => {
        return allMockReports.filter(
          report => report.reportDate >= startDate && report.reportDate <= endDate
        );
      })
    };

    // Execute the extraction function with mocked dependencies
    const result: WeeklyReportDataset = await extractWeeklyReportData(
      extractionRequest,
      mockTextAnalysisServiceAdapter,
      mockDatabaseAdapter
    );

    // Validate week range
    expect(result.weekRange.startDate).toEqual(new Date('2023-12-30T00:00:00Z'));
    expect(result.weekRange.endDate).toEqual(new Date('2024-01-05T23:59:59Z'));

    // Validate total reports extracted equals 10 (5 from 2023 + 5 from 2024)
    expect(result.totalReportsExtracted).toBe(10);

    // Validate reportsByDate structure contains all dates
    expect(result.reportsByDate.length).toBe(7); // 2023-12-30, 12-31, 2024-01-01, 01-02, 01-03, 01-04, 01-05
    expect(result.reportsByDate).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          reportDate: expect.any(Date),
          reportCount: expect.any(Number),
          submittedByUserIds: expect.any(Array),
          challengeItems: expect.any(Array)
        })
      ])
    );

    // Validate year 2023 data (2023-12-30 and 2023-12-31)
    const year2023Summary = result.reportsByDate.filter(
      daily => daily.reportDate.getFullYear() === 2023
    );
    expect(year2023Summary.length).toBe(2);
    const year2023Total = year2023Summary.reduce((sum, daily) => sum + daily.reportCount, 0);
    expect(year2023Total).toBe(5);

    // Validate year 2024 data (2024-01-01 through 2024-01-05)
    const year2024Summary = result.reportsByDate.filter(
      daily => daily.reportDate.getFullYear() === 2024
    );
    expect(year2024Summary.length).toBe(5);
    const year2024Total = year2024Summary.reduce((sum, daily) => sum + daily.reportCount, 0);
    expect(year2024Total).toBe(5);

    // Validate extracted challenges contain keywords from both years
    expect(result.extractedChallenges).toBeDefined();
    expect(Array.isArray(result.extractedChallenges)).toBe(true);

    // Validate that challenge keywords are aggregated across year boundary
    const challengeKeywords = result.extractedChallenges.map(ch => ch.keyword);
    expect(challengeKeywords).toContain('サーバー障害');
    expect(challengeKeywords).toContain('ネットワーク遅延');
    expect(challengeKeywords).toContain('データベース接続');

    // Validate occurrence counts aggregate across both years
    const serverFailureChallenge = result.extractedChallenges.find(
      ch => ch.keyword === 'サーバー障害'
    );
    expect(serverFailureChallenge).toBeDefined();
    expect(serverFailureChallenge?.occurrenceCount).toBe(3); // appears in 2023-12-30, 2024-01-01, 2024-01-03

    // Validate data quality score is within acceptable range
    expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);

    // Validate that each daily summary correctly reflects its year
    result.reportsByDate.forEach((dailySummary: DailyReportSummary) => {
      const year = dailySummary.reportDate.getFullYear();
      expect([2023, 2024]).toContain(year);
      expect(dailySummary.reportCount).toBeGreaterThan(0);
      expect(dailySummary.submittedByUserIds.length).toBe(dailySummary.reportCount);
      expect(Array.isArray(dailySummary.challengeItems)).toBe(true);
    });

    // Verify database adapter was called with correct date range
    expect(mockDatabaseAdapter.getReportsByDateRange).toHaveBeenCalledWith(
      expect.any(Date),
      expect.any(Date)
    );

    // Verify text analysis service was invoked for keyword extraction
    expect(mockTextAnalysisServiceAdapter.extractKeywords).toHaveBeenCalled();
  });
});