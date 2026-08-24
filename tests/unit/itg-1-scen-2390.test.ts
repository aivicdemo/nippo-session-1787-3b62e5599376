import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';

describe('Monthly Performance Analysis - extractMonthlyReportData', () => {
  // SCEN-2390: [normal] 日報データ集約・アーカイブ機能 - 期間外の日報データがアーカイブ領域に移行される
  test('should archive out-of-period reports and retain in-period reports', () => {
    // Setup: Define archive target period (January 2024)
    const archiveTargetStart = new Date('2024-01-01T00:00:00Z');
    const archiveTargetEnd = new Date('2024-01-31T23:59:59Z');

    // Setup: Create report records
    const reportsBefore2024 = Array.from({ length: 5 }, (_, i) => ({
      reportId: `report-2023-12-${String(i + 1).padStart(2, '0')}`,
      reportedDate: new Date(`2023-12-${String((i % 30) + 1).padStart(2, '0')}T09:00:00Z`),
      submittedDate: new Date(`2023-12-${String((i % 30) + 1).padStart(2, '0')}T09:15:00Z`),
      teamId: `team-${i % 2}`,
      userId: `user-${i}`,
      yesterdayActivities: `Yesterday activity ${i}`,
      todayPlans: `Today plan ${i}`,
      issues: `Issue description ${i}`,
      status: 'submitted' as const,
      createdAt: new Date(`2023-12-${String((i % 30) + 1).padStart(2, '0')}T09:15:00Z`),
      archivedAt: null as Date | null,
    }));

    const reportsInPeriod2024 = Array.from({ length: 10 }, (_, i) => ({
      reportId: `report-2024-01-${String((i % 31) + 1).padStart(2, '0')}-v1`,
      reportedDate: new Date(`2024-01-${String((i % 31) + 1).padStart(2, '0')}T09:00:00Z`),
      submittedDate: new Date(`2024-01-${String((i % 31) + 1).padStart(2, '0')}T09:15:00Z`),
      teamId: `team-${i % 3}`,
      userId: `user-${(i + 5) % 10}`,
      yesterdayActivities: `January activity ${i}`,
      todayPlans: `January plan ${i}`,
      issues: `January issue ${i}`,
      status: 'submitted' as const,
      createdAt: new Date(`2024-01-${String((i % 31) + 1).padStart(2, '0')}T09:15:00Z`),
      archivedAt: null as Date | null,
    }));

    const reportsAfter2024 = Array.from({ length: 3 }, (_, i) => ({
      reportId: `report-2026-09-${String(i + 1).padStart(2, '0')}`,
      reportedDate: new Date(`2026-09-${String(i + 1).padStart(2, '0')}T09:00:00Z`),
      submittedDate: new Date(`2026-09-${String(i + 1).padStart(2, '0')}T09:15:00Z`),
      teamId: `team-${i % 2}`,
      userId: `user-${(i + 8) % 10}`,
      yesterdayActivities: `Future activity ${i}`,
      todayPlans: `Future plan ${i}`,
      issues: `Future issue ${i}`,
      status: 'submitted' as const,
      createdAt: new Date(`2026-09-${String(i + 1).padStart(2, '0')}T09:15:00Z`),
      archivedAt: null as Date | null,
    }));

    const allReports = [...reportsBefore2024, ...reportsInPeriod2024, ...reportsAfter2024];

    // Execute: Extract monthly report data with archive logic
    const result = extractMonthlyReportData({
      targetYear: 2024,
      targetMonth: 1,
      requestedByUserId: 'user-admin',
      teamIdFilter: undefined,
      allReports: allReports,
      archiveConfig: {
        enableArchive: true,
        archiveThresholdMs: 0, // Archive all records outside the period
      },
    });

    // Verify: Extract response structure
    expect(result).toBeDefined();
    expect(result.extractionPeriodStart).toBe('2024-01-01T00:00:00Z');
    expect(result.extractionPeriodEnd).toBe('2024-01-31T23:59:59Z');

    // Verify: Total report count includes only in-period reports
    expect(result.totalReportCount).toBe(10);

    // Verify: Reports by team - only in-period reports are included
    expect(result.reportsByTeam).toBeDefined();
    expect(Array.isArray(result.reportsByTeam)).toBe(true);

    // Verify: Aggregation of team report counts matches in-period count
    const totalTeamReports = result.reportsByTeam.reduce(
      (sum, teamSummary) => sum + teamSummary.reportCount,
      0
    );
    expect(totalTeamReports).toBe(10);

    // Verify: Data quality score is calculated
    expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);

    // Verify: Extraction timestamp is recorded
    expect(result.extractedAt).toBeDefined();
    const extractedTimestamp = new Date(result.extractedAt);
    expect(extractedTimestamp instanceof Date && !isNaN(extractedTimestamp.getTime())).toBe(true);

    // Verify: Archive information is included in result
    if (result.archiveInfo) {
      expect(result.archiveInfo.archivedReportCount).toBe(8);
      expect(result.archiveInfo.retainedReportCount).toBe(10);
      expect(Array.isArray(result.archiveInfo.archivedReportIds)).toBe(true);
      expect(result.archiveInfo.archivedReportIds).toHaveLength(8);

      // Verify: Archived reports are identified correctly
      const archivedIds = result.archiveInfo.archivedReportIds;
      const expectedArchivedIds = [
        ...reportsBefore2024.map((r) => r.reportId),
        ...reportsAfter2024.map((r) => r.reportId),
      ];
      expect(archivedIds.sort()).toEqual(expectedArchivedIds.sort());

      // Verify: Retained reports are from in-period only
      const retainedIds = reportsInPeriod2024.map((r) => r.reportId);
      expect(result.reportsByTeam.flatMap((t) => t.reportIds).sort()).toEqual(retainedIds.sort());
    }

    // Verify: Each team summary contains proper fields
    result.reportsByTeam.forEach((teamSummary) => {
      expect(teamSummary.teamId).toBeDefined();
      expect(typeof teamSummary.teamId).toBe('string');
      expect(teamSummary.reportCount).toBeGreaterThan(0);
      expect(teamSummary.reportCount).toBeLessThanOrEqual(10);
      expect(typeof teamSummary.submissionRate).toBe('number');
      expect(teamSummary.submissionRate).toBeGreaterThanOrEqual(0);
      expect(teamSummary.submissionRate).toBeLessThanOrEqual(100);
      expect(Array.isArray(teamSummary.reportIds)).toBe(true);
      expect(teamSummary.reportIds.every((id) => typeof id === 'string')).toBe(true);
    });
  });
});