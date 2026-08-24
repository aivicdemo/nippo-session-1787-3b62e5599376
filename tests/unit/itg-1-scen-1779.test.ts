import { describe, test, expect } from '@jest/globals';
import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';
import type { MonthlyExtractionRequest, MonthlyReportDataset } from '../../src/logic/monthly-performance-analysis';

describe('monthly-performance-analysis', () => {
  // SCEN-1779: [edge] 月次レポート生成機能 - 抽出期間が前月末日23:59直後の報告を除外する
  test('should exclude reports before extraction period start boundary', async () => {
    // Arrange
    const targetYear = 2024;
    const targetMonth = 2; // February

    const request: MonthlyExtractionRequest = {
      targetYear,
      targetMonth,
      requestedByUserId: 'user-001',
      teamIdFilter: undefined,
    };

    // Mock reports with specific timestamps around the boundary
    // Previous month end (January 31, 2024) at 23:59 and 23:59:59
    // Current month start (February 1, 2024) at 00:00 and after
    const mockReports = [
      {
        id: 'report-prev-2359',
        submittedAt: new Date('2024-01-31T23:59:00Z'),
        teamId: 'team-001',
        userId: 'user-001',
        content: 'Previous month 23:59 report',
      },
      {
        id: 'report-prev-235959',
        submittedAt: new Date('2024-01-31T23:59:59Z'),
        teamId: 'team-001',
        userId: 'user-002',
        content: 'Previous month 23:59:59 report',
      },
      {
        id: 'report-curr-0000',
        submittedAt: new Date('2024-02-01T00:00:00Z'),
        teamId: 'team-001',
        userId: 'user-003',
        content: 'Current month 00:00 report',
      },
      {
        id: 'report-curr-0001',
        submittedAt: new Date('2024-02-01T00:00:01Z'),
        teamId: 'team-001',
        userId: 'user-004',
        content: 'Current month 00:00:01 report',
      },
    ];

    // Mock TextAnalysisServiceAdapter that returns valid keywords
    const textAnalysisServiceAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ['keyword1', 'keyword2'],
        frequency: [2, 1],
      }),
      assessImpactScore: jest.fn().mockResolvedValue(75),
      classifyIssueSeverity: jest.fn().mockResolvedValue('high'),
    };

    // Act
    const result: MonthlyReportDataset = await extractMonthlyReportData(
      request,
      mockReports,
      textAnalysisServiceAdapter,
    );

    // Assert
    // Only reports from February 1, 2024 00:00:00 onwards should be included
    expect(result.totalReportCount).toBe(2);
    expect(result.reportsByTeam).toHaveLength(1);
    expect(result.reportsByTeam[0].reportIds).toEqual(['report-curr-0000', 'report-curr-0001']);

    // Verify all included reports are within the extraction period
    result.reportsByTeam[0].reportIds.forEach((reportId) => {
      const report = mockReports.find((r) => r.id === reportId);
      expect(report).toBeDefined();
      const submittedTime = report!.submittedAt.getTime();
      const extractionStartTime = new Date(`${targetYear}-${String(targetMonth).padStart(2, '0')}-01T00:00:00Z`).getTime();
      expect(submittedTime).toBeGreaterThanOrEqual(extractionStartTime);
    });

    // Verify excluded reports are indeed outside the boundary
    const excludedReportIds = ['report-prev-2359', 'report-prev-235959'];
    excludedReportIds.forEach((reportId) => {
      expect(result.reportsByTeam[0].reportIds).not.toContain(reportId);
    });

    // Verify extraction period is correctly set in output
    const extractionStartISO = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01T00:00:00Z`;
    expect(result.extractionPeriodStart).toBe(extractionStartISO);
  });
});