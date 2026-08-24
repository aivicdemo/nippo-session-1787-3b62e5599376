import { extractWeeklyReportData } from '../../src/logic/weekly-issue-analysis';
import type { WeeklyExtractionRequest, WeeklyReportDataset, DailyReportSummary } from '../../src/logic/weekly-issue-analysis';

describe('Weekly Report Data Aggregation - Edge Case: 6-Day Week (Mon-Sat)', () => {
  test('SCEN-1464: Aggregates only 6 days of reports (Mon-Sat) when week is shortened, excluding Sunday', () => {
    // Setup: Create test dataset for 6-day week (Monday to Saturday)
    // Monday 2024-01-08 to Saturday 2024-01-13 (excluding Sunday 2024-01-14)
    const weekStartDate = new Date('2024-01-08T00:00:00Z'); // Monday
    const weekEndDate = new Date('2024-01-13T23:59:59Z');   // Saturday (6 days only)
    
    const teamIds = ['team-1'];
    const requestedByUserId = 'user-director-1';

    // Create test data: 10 users × 6 days = 60 reports expected
    const createTestReport = (
      userId: string,
      reportDate: Date,
      yesterdayWork: string,
      todayPlan: string,
      challengeItem: string
    ): DailyReportSummary => ({
      reportDate,
      reportCount: 1,
      submittedByUserIds: [userId],
      challengeItems: [challengeItem]
    });

    const testReports: DailyReportSummary[] = [];
    const userIds = Array.from({ length: 10 }, (_, i) => `user-engineer-${i + 1}`);
    
    // Generate reports for Monday (2024-01-08) to Saturday (2024-01-13)
    for (let dayOffset = 0; dayOffset < 6; dayOffset++) {
      const reportDate = new Date(weekStartDate);
      reportDate.setDate(reportDate.getDate() + dayOffset);
      reportDate.setHours(9, 30, 0, 0); // Set to 09:30 for consistency

      for (const userId of userIds) {
        testReports.push(
          createTestReport(
            userId,
            reportDate,
            `Yesterday work on day ${dayOffset + 1}`,
            `Today plan on day ${dayOffset + 1}`,
            `Challenge: Database performance issue on day ${dayOffset + 1}`
          )
        );
      }
    }

    // Create extraction request for 6-day period
    const extractionRequest: WeeklyExtractionRequest = {
      weekStartDate,
      weekEndDate,
      teamIds,
      requestedByUserId
    };

    // Mock input dataset structure (simulating aggregated daily reports)
    const inputDataset = {
      weekRange: {
        startDate: weekStartDate,
        endDate: weekEndDate
      },
      reportsByDate: testReports,
      totalReportsExtracted: testReports.length,
      extractedChallenges: [],
      dataQualityScore: 85
    };

    // Execute extraction (this function would internally process the request)
    // Note: The actual implementation should validate date range
    const result: WeeklyReportDataset = extractWeeklyReportData(extractionRequest);

    // Verify: Aggregated reports count matches 10 users × 6 days = 60
    expect(result.totalReportsExtracted).toBe(60);

    // Verify: All dates are within Monday to Saturday range
    const reportDates = result.reportsByDate.map(r => r.reportDate.toISOString().split('T')[0]);
    const uniqueReportDates = Array.from(new Set(reportDates));
    
    expect(uniqueReportDates.length).toBe(6);

    // Verify: Date range covers only 6 days (Monday 2024-01-08 to Saturday 2024-01-13)
    const minDate = new Date(Math.min(...result.reportsByDate.map(r => r.reportDate.getTime())));
    const maxDate = new Date(Math.max(...result.reportsByDate.map(r => r.reportDate.getTime())));

    expect(minDate.getUTCDate()).toBe(8);  // Monday
    expect(maxDate.getUTCDate()).toBe(13); // Saturday

    // Verify: Sunday (2024-01-14) is not included
    const sundayDate = new Date('2024-01-14T00:00:00Z');
    const hasSundayData = result.reportsByDate.some(
      r => r.reportDate.toISOString().split('T')[0] === sundayDate.toISOString().split('T')[0]
    );
    expect(hasSundayData).toBe(false);

    // Verify: Data quality score is maintained
    expect(result.dataQualityScore).toBeGreaterThanOrEqual(70);

    // Verify: reportsByDate contains expected number of daily summaries (6 days)
    expect(result.reportsByDate.length).toBe(60);

    // Verify: Each report has correct structure with challenge items
    result.reportsByDate.forEach(dailySummary => {
      expect(dailySummary.reportDate).toEqual(expect.any(Date));
      expect(dailySummary.reportCount).toBeGreaterThan(0);
      expect(dailySummary.submittedByUserIds).toEqual(expect.any(Array));
      expect(dailySummary.submittedByUserIds.length).toBeGreaterThan(0);
      expect(dailySummary.challengeItems).toEqual(expect.any(Array));
      expect(dailySummary.challengeItems.length).toBeGreaterThan(0);
    });

    // Verify: No reports from outside the 6-day window exist
    const allReportDatesMs = result.reportsByDate.map(r => r.reportDate.getTime());
    const weekStartMs = weekStartDate.getTime();
    const weekEndMs = weekEndDate.getTime();

    allReportDatesMs.forEach(reportDateMs => {
      expect(reportDateMs).toBeGreaterThanOrEqual(weekStartMs);
      expect(reportDateMs).toBeLessThanOrEqual(weekEndMs);
    });
  });
});