import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';

describe('月次レポート生成機能 - 集計対象期間の正確性', () => {
  let originalDateNow: () => number;

  beforeEach(() => {
    originalDateNow = Date.now;
    const fixedTestDate = new Date('2026-09-15T00:00:00Z').getTime();
    Date.now = jest.fn(() => fixedTestDate);
  });

  afterEach(() => {
    Date.now = originalDateNow;
  });

  // SCEN-1822
  test('前月1日00:00:00（UTC）から前月末日23:59:59（UTC）の期間が正確に集計対象として設定される', () => {
    const targetYear = 2026;
    const targetMonth = 8;

    const input = {
      targetYear,
      targetMonth,
      requestedByUserId: 'user-dept-head-001',
    };

    const result = extractMonthlyReportData(input);

    const expectedStartDate = '2026-08-01T00:00:00Z';
    const expectedEndDate = '2026-08-31T23:59:59Z';

    expect(result.extractionPeriodStart).toBe(expectedStartDate);
    expect(result.extractionPeriodEnd).toBe(expectedEndDate);

    const allReportIds = result.reportsByTeam.flatMap((team) => team.reportIds);
    expect(allReportIds.length).toBeGreaterThan(0);

    const reportIdsFromRecords = result.reportsByTeam
      .flatMap((team) => team.reportIds);
    
    expect(reportIdsFromRecords).not.toContain(undefined);
    expect(reportIdsFromRecords).not.toContain(null);

    expect(result.totalReportCount).toBe(allReportIds.length);

    const aggregationPeriodText = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01 ～ ${targetYear}-${String(targetMonth).padStart(2, '0')}-31`;
    
    expect(result).toHaveProperty('extractionPeriodStart');
    expect(result).toHaveProperty('extractionPeriodEnd');
    expect(result).toHaveProperty('reportsByTeam');
    expect(result).toHaveProperty('totalReportCount');
    expect(result).toHaveProperty('dataQualityScore');
    expect(result).toHaveProperty('extractedAt');

    expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);

    result.reportsByTeam.forEach((teamSummary) => {
      expect(teamSummary).toHaveProperty('teamId');
      expect(teamSummary).toHaveProperty('reportCount');
      expect(teamSummary).toHaveProperty('submissionRate');
      expect(teamSummary).toHaveProperty('reportIds');
      expect(teamSummary.submissionRate).toBeGreaterThanOrEqual(0);
      expect(teamSummary.submissionRate).toBeLessThanOrEqual(100);
      expect(Array.isArray(teamSummary.reportIds)).toBe(true);
    });

    const extractedAtDate = new Date(result.extractedAt);
    expect(extractedAtDate.getTime()).toBeGreaterThan(0);
  });
});