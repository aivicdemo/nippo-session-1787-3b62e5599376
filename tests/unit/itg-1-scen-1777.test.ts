import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';

describe('Monthly Performance Analysis - extractMonthlyReportData', () => {
  // SCEN-1777: [edge] 月次レポート生成機能 - 抽出期間が前月1日00:00直前の報告を除外する
  test('should exclude reports submitted before the extraction period start (one second before 2025-01-01 00:00:00 JST) and include reports from the exact start time onwards', () => {
    // Setup: Define extraction period as January 2025 (2025-01-01 00:00:00 to 2025-01-31 23:59:59 JST)
    const extractionPeriodStart = '2025-01-01T00:00:00Z';
    const extractionPeriodEnd = '2025-01-31T23:59:59Z';
    const targetYear = 2025;
    const targetMonth = 1;

    // Create mock report records with specific timestamps
    // Record 1: 1 second before the extraction period start (should be EXCLUDED)
    const reportBeforePeriod = {
      reportId: 'report-before-001',
      submittedAt: new Date('2024-12-31T14:59:59Z'), // 2025-01-01 00:00:00 JST minus 1 second
      teamId: 'team-alpha',
      content: 'Report submitted before period start',
      status: 'submitted' as const,
    };

    // Record 2: Exactly at the extraction period start (should be INCLUDED)
    const reportAtPeriodStart = {
      reportId: 'report-start-001',
      submittedAt: new Date('2024-12-31T15:00:00Z'), // 2025-01-01 00:00:00 JST exactly
      teamId: 'team-alpha',
      content: 'Report submitted at period start',
      status: 'submitted' as const,
    };

    // Record 3: 1 second after the extraction period start (should be INCLUDED)
    const reportAfterPeriodStart = {
      reportId: 'report-after-001',
      submittedAt: new Date('2024-12-31T15:00:01Z'), // 2025-01-01 00:00:01 JST
      teamId: 'team-alpha',
      content: 'Report submitted after period start',
      status: 'submitted' as const,
    };

    // Record 4: Mid-period (should be INCLUDED)
    const reportMidPeriod = {
      reportId: 'report-mid-001',
      submittedAt: new Date('2025-01-15T08:30:00Z'), // 2025-01-15 17:30:00 JST
      teamId: 'team-beta',
      content: 'Report submitted mid-period',
      status: 'submitted' as const,
    };

    // Record 5: End of period (should be INCLUDED)
    const reportAtPeriodEnd = {
      reportId: 'report-end-001',
      submittedAt: new Date('2025-01-31T14:59:59Z'), // 2025-01-31 23:59:59 JST
      teamId: 'team-beta',
      content: 'Report submitted at period end',
      status: 'submitted' as const,
    };

    const allReports = [
      reportBeforePeriod,
      reportAtPeriodStart,
      reportAfterPeriodStart,
      reportMidPeriod,
      reportAtPeriodEnd,
    ];

    // Execute: Call extractMonthlyReportData
    const result = extractMonthlyReportData({
      targetYear,
      targetMonth,
      requestedByUserId: 'user-pm-001',
      teamIdFilter: undefined,
    });

    // Verify: Check that result contains the correct structure
    expect(result).toHaveProperty('extractionPeriodStart');
    expect(result).toHaveProperty('extractionPeriodEnd');
    expect(result).toHaveProperty('totalReportCount');
    expect(result).toHaveProperty('reportsByTeam');
    expect(result).toHaveProperty('dataQualityScore');
    expect(result).toHaveProperty('extractedAt');

    // Verify: Extraction period boundaries are correct
    expect(result.extractionPeriodStart).toBe(extractionPeriodStart);
    expect(result.extractionPeriodEnd).toBe(extractionPeriodEnd);

    // Verify: Total report count is 4 (excluding the one submitted 1 second before period start)
    expect(result.totalReportCount).toBe(4);

    // Verify: reportsByTeam array contains entries for teams with reports
    expect(result.reportsByTeam.length).toBeGreaterThan(0);

    // Verify: Team summaries contain correct counts
    const teamAlphaSummary = result.reportsByTeam.find(
      (summary) => summary.teamId === 'team-alpha'
    );
    expect(teamAlphaSummary).toBeDefined();
    expect(teamAlphaSummary?.reportCount).toBe(2); // reportAtPeriodStart + reportAfterPeriodStart

    const teamBetaSummary = result.reportsByTeam.find(
      (summary) => summary.teamId === 'team-beta'
    );
    expect(teamBetaSummary).toBeDefined();
    expect(teamBetaSummary?.reportCount).toBe(2); // reportMidPeriod + reportAtPeriodEnd

    // Verify: The report before period is excluded (reportId 'report-before-001' should not appear)
    const allReportIds = result.reportsByTeam.flatMap((summary) => summary.reportIds);
    expect(allReportIds).not.toContain('report-before-001');

    // Verify: All other reports are included
    expect(allReportIds).toContain('report-start-001');
    expect(allReportIds).toContain('report-after-001');
    expect(allReportIds).toContain('report-mid-001');
    expect(allReportIds).toContain('report-end-001');

    // Verify: Data quality score is within valid range
    expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);

    // Verify: extractedAt is a valid ISO 8601 timestamp
    const extractedAtDate = new Date(result.extractedAt);
    expect(extractedAtDate.getTime()).toBeGreaterThan(0);
  });
});