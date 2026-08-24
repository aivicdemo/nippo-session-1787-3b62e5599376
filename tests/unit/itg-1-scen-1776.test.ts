import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';

describe('Monthly Performance Analysis - Report Data Extraction', () => {
  test('SCEN-1776: should include report created exactly at extraction period start boundary and exclude report created after', () => {
    const extractionPeriodStart = new Date('2024-01-01T00:00:00Z');
    const extractionPeriodEnd = new Date('2024-01-30T23:59:59Z');
    const targetYear = 2024;
    const targetMonth = 1;

    const reportCreatedAtBoundary = {
      id: 'report_001',
      userId: 'user001',
      createdAt: extractionPeriodStart,
      content: 'タスクA完了',
      teamId: 'team001',
      lastUpdatedAt: extractionPeriodStart,
    };

    const reportCreatedAfterBoundary = {
      id: 'report_002',
      userId: 'user002',
      createdAt: new Date('2024-02-01T00:00:01Z'),
      content: 'タスクB完了',
      teamId: 'team001',
      lastUpdatedAt: new Date('2024-02-01T00:00:01Z'),
    };

    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockReturnValue({
        keywords: ['タスクA'],
        frequencies: [1],
      }),
      assessImpactScore: jest.fn().mockReturnValue(50),
      classifyIssueSeverity: jest.fn().mockReturnValue('medium'),
    };

    const reportRecords = [reportCreatedAtBoundary, reportCreatedAfterBoundary];

    const result = extractMonthlyReportData(
      {
        targetYear,
        targetMonth,
        requestedByUserId: 'admin001',
      },
      reportRecords,
      mockTextAnalysisAdapter
    );

    expect(result.extractionPeriodStart).toEqual(
      extractionPeriodStart.toISOString()
    );
    expect(result.extractionPeriodEnd).toEqual(extractionPeriodEnd.toISOString());
    expect(result.totalReportCount).toBe(1);
    expect(result.reportsByTeam).toHaveLength(1);
    expect(result.reportsByTeam[0].teamId).toBe('team001');
    expect(result.reportsByTeam[0].reportCount).toBe(1);
    expect(result.reportsByTeam[0].reportIds).toEqual(['report_001']);
    expect(result.reportsByTeam[0].reportIds).not.toContain('report_002');
  });
});