import { describe, test, expect } from '@jest/globals';
import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';

describe('Monthly Performance Analysis - extractMonthlyReportData', () => {
  // SCEN-1785: [edge] 月次レポート生成機能 - 同一タイムスタンプの複数報告がある場合にすべてを含める
  test('should include all reports with identical timestamp in monthly dataset', () => {
    const targetYear = 2024;
    const targetMonth = 1;
    const requestedByUserId = 'user-manager-001';
    const sharedTimestamp = '2024-01-15T09:00:00Z';

    const mockInput = {
      targetYear,
      targetMonth,
      requestedByUserId,
    };

    const result = extractMonthlyReportData(mockInput);

    expect(result).toBeDefined();
    expect(result.extractionPeriodStart).toBe('2024-01-01T00:00:00Z');
    expect(result.extractionPeriodEnd).toBe('2024-01-31T23:59:59Z');

    const reportWithTimestamp = result.reportsByTeam.flatMap((teamSummary) =>
      teamSummary.reportIds.filter((reportId) => reportId.includes(sharedTimestamp))
    );

    expect(reportWithTimestamp.length).toBeGreaterThanOrEqual(3);

    expect(result.totalReportCount).toBeGreaterThanOrEqual(3);
    expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);
    expect(result.extractedAt).toBeDefined();

    const extractedAtDate = new Date(result.extractedAt);
    expect(extractedAtDate.getTime()).toBeGreaterThan(0);

    expect(result.reportsByTeam).toBeInstanceOf(Array);
    expect(result.reportsByTeam.length).toBeGreaterThan(0);

    result.reportsByTeam.forEach((teamSummary) => {
      expect(teamSummary.teamId).toBeDefined();
      expect(typeof teamSummary.teamId).toBe('string');
      expect(teamSummary.reportCount).toBeGreaterThanOrEqual(0);
      expect(teamSummary.submissionRate).toBeGreaterThanOrEqual(0);
      expect(teamSummary.submissionRate).toBeLessThanOrEqual(100);
      expect(teamSummary.reportIds).toBeInstanceOf(Array);
    });
  });
});