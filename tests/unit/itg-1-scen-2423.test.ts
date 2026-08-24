import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';

describe('monthly-performance-analysis', () => {
  // SCEN-2423: [edge] 日報データ集約・アーカイブ管理機能 - 業務上の最大規模（月次で数千件）の日報データを集約期間として指定したとき、すべてが集約対象に含まれる
  test('should aggregate exactly 3000 daily reports within the specified month period and exclude out-of-period data', () => {
    const aggregationStartDate = '2024-01-01';
    const aggregationEndDate = '2024-01-31';
    const targetYear = 2024;
    const targetMonth = 1;
    const businessDaysInMonth = 22;
    const numberOfEmployees = 10;
    const expectedReportCountInPeriod = 3000;

    const reportRecords = [];

    // Generate 3000 reports within the target period (Jan 1-31, 2024)
    // 22 business days × 10 employees = 220 reports per day, approximately 13.6 days of data
    // to reach 3000 reports: 3000 / (22 * 10) = 13.6 cycles, so generate across multiple days
    const reportsPerDay = numberOfEmployees;
    const daysNeeded = Math.ceil(expectedReportCountInPeriod / reportsPerDay);

    let reportId = 1;
    for (let dayOffset = 0; dayOffset < daysNeeded; dayOffset++) {
      const reportDate = new Date(2024, 0, 1 + dayOffset);
      reportDate.setHours(9, 30, 0, 0);

      for (let empIndex = 0; empIndex < numberOfEmployees; empIndex++) {
        reportRecords.push({
          reportId: `report-${reportId}`,
          employeeId: `emp-${empIndex + 1}`,
          teamId: `team-${Math.floor(empIndex / 5) + 1}`,
          reportDate: reportDate.toISOString(),
          yesterdayContent: `Completed task ${reportId}`,
          todayContent: `Planned task ${reportId}`,
          issueContent: `Issue item ${reportId}`,
          submissionTime: reportDate.toISOString(),
        });
        reportId++;
        if (reportRecords.length >= expectedReportCountInPeriod) {
          break;
        }
      }
      if (reportRecords.length >= expectedReportCountInPeriod) {
        break;
      }
    }

    // Trim to exactly 3000 reports
    const reportsInPeriod = reportRecords.slice(0, expectedReportCountInPeriod);

    // Generate out-of-period reports (before Jan 1 and after Jan 31)
    const reportsBefore = [];
    for (let i = 0; i < 50; i++) {
      const beforeDate = new Date(2023, 11, 31 - i);
      beforeDate.setHours(9, 30, 0, 0);
      reportsBefore.push({
        reportId: `report-before-${i}`,
        employeeId: `emp-${(i % numberOfEmployees) + 1}`,
        teamId: `team-1`,
        reportDate: beforeDate.toISOString(),
        yesterdayContent: `Before period task ${i}`,
        todayContent: `Before period planned ${i}`,
        issueContent: `Before period issue ${i}`,
        submissionTime: beforeDate.toISOString(),
      });
    }

    const reportsAfter = [];
    for (let i = 0; i < 50; i++) {
      const afterDate = new Date(2024, 1, 1 + i);
      afterDate.setHours(9, 30, 0, 0);
      reportsAfter.push({
        reportId: `report-after-${i}`,
        employeeId: `emp-${(i % numberOfEmployees) + 1}`,
        teamId: `team-1`,
        reportDate: afterDate.toISOString(),
        yesterdayContent: `After period task ${i}`,
        todayContent: `After period planned ${i}`,
        issueContent: `After period issue ${i}`,
        submissionTime: afterDate.toISOString(),
      });
    }

    const allReports = [...reportsBefore, ...reportsInPeriod, ...reportsAfter];

    const result = extractMonthlyReportData({
      targetYear,
      targetMonth,
      reportRecords: allReports,
    });

    expect(result.totalReportCount).toBe(3000);
    expect(result.reportIds).toHaveLength(3000);
    expect(result.reportIds).toEqual(
      reportsInPeriod.map((r) => r.reportId)
    );

    // Verify no out-of-period reports are included
    const outOfPeriodReportIds = new Set([
      ...reportsBefore.map((r) => r.reportId),
      ...reportsAfter.map((r) => r.reportId),
    ]);

    result.reportIds.forEach((id) => {
      expect(outOfPeriodReportIds.has(id)).toBe(false);
    });

    // Verify extraction period metadata
    const expectedPeriodStart = '2024-01-01T00:00:00Z';
    const expectedPeriodEnd = '2024-01-31T23:59:59Z';

    expect(result.extractionPeriodStart).toBe(expectedPeriodStart);
    expect(result.extractionPeriodEnd).toBe(expectedPeriodEnd);
  });
});