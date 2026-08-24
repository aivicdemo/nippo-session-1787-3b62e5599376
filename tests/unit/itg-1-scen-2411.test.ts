import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';
import type { MonthlyReportDataset, ExtractionValidationResult } from '../../src/logic/monthly-performance-analysis';

describe('Monthly Performance Analysis - extractMonthlyReportData', () => {
  // SCEN-2411: [edge] 日報データ集約・アーカイブ管理機能 - 集約期間の開始日時点で、期間内の日報データがちょうど保持期間の上限に達するとき、すべてが集約対象に含まれる
  test('should include all report data when aggregation period start matches retention limit boundary', async () => {
    // Setup: Define retention period limit (90 days)
    const retentionLimitDays = 90;
    const baseDate = new Date('2024-01-15T00:00:00Z');
    const aggregationStartDate = new Date(baseDate.getTime() - retentionLimitDays * 24 * 60 * 60 * 1000);
    aggregationStartDate.setHours(0, 0, 0, 0);
    const aggregationEndDate = new Date(baseDate);
    aggregationEndDate.setHours(23, 59, 59, 999);

    // Create 10 report records distributed within retention period
    const reportRecords = [];
    for (let i = 0; i < 10; i++) {
      const reportDate = new Date(aggregationStartDate.getTime() + (i * 9 * 24 * 60 * 60 * 1000));
      reportRecords.push({
        reportId: `report_${i}`,
        userId: `user_${i}`,
        teamId: `team_${(i % 3)}`,
        reportedDate: reportDate.toISOString(),
        yesterdayAccomplishments: `Accomplished task ${i}`,
        todayPlans: `Plan task ${i}`,
        issues: `Issue found ${i}`,
        createdAt: reportDate.toISOString(),
        updatedAt: reportDate.toISOString(),
      });
    }

    // Mock NotificationServiceAdapter
    const mockNotificationAdapter = {
      sendReminderNotification: jest.fn().mockResolvedValue({ success: true }),
      scheduleNotification: jest.fn().mockResolvedValue({ scheduled: true }),
      getDeliveryStatus: jest.fn().mockResolvedValue({ status: 'delivered' }),
    };

    // Mock TextAnalysisServiceAdapter
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: [
          { keyword: 'critical_issue', frequency: 3 },
          { keyword: 'performance_degradation', frequency: 2 },
        ],
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        impactScore: 75,
        severity: 'high' as const,
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        severity: 'high' as const,
      }),
    };

    // Execute extraction with aggregation period matching retention boundary
    const result: MonthlyReportDataset = await extractMonthlyReportData(
      {
        targetYear: 2024,
        targetMonth: 1,
        requestedByUserId: 'user_department_head',
        teamIdFilter: undefined,
      },
      mockNotificationAdapter,
      mockTextAnalysisAdapter,
    );

    // Assertions: Verify all 10 reports are included in aggregation
    expect(result).toBeDefined();
    expect(result.totalReportCount).toBe(10);
    expect(result.reportsByTeam).toBeDefined();
    expect(result.reportsByTeam.length).toBeGreaterThan(0);

    // Verify aggregation period boundaries
    expect(result.extractionPeriodStart).toBe(aggregationStartDate.toISOString());
    expect(new Date(result.extractionPeriodStart).getTime()).toBeGreaterThanOrEqual(
      aggregationStartDate.getTime(),
    );

    // Verify all reports are within retention period
    const allReportIds = result.reportsByTeam.flatMap((teamSummary) => teamSummary.reportIds);
    expect(allReportIds.length).toBe(10);
    expect(new Set(allReportIds).size).toBe(10); // Ensure no duplicates

    // Verify report IDs match created reports
    for (let i = 0; i < 10; i++) {
      expect(allReportIds).toContain(`report_${i}`);
    }

    // Verify data quality score is within valid range
    expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);

    // Verify extraction was performed successfully
    expect(result.extractedAt).toBeDefined();
    const extractionTimestamp = new Date(result.extractedAt);
    expect(extractionTimestamp.getTime()).toBeLessThanOrEqual(new Date().getTime());

    // Verify team report summaries contain submission rate data
    for (const teamSummary of result.reportsByTeam) {
      expect(teamSummary.teamId).toBeDefined();
      expect(teamSummary.reportCount).toBeGreaterThan(0);
      expect(teamSummary.submissionRate).toBeGreaterThanOrEqual(0);
      expect(teamSummary.submissionRate).toBeLessThanOrEqual(100);
      expect(teamSummary.reportIds).toBeDefined();
      expect(Array.isArray(teamSummary.reportIds)).toBe(true);
    }

    // Verify submission rate reflects all reports captured
    const totalReportsInTeamSummaries = result.reportsByTeam.reduce(
      (sum, team) => sum + team.reportCount,
      0,
    );
    expect(totalReportsInTeamSummaries).toBe(10);
  });
});