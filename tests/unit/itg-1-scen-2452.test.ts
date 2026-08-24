import { validateMonthlyReportApproval } from '../../src/logic/monthly-performance-analysis';

describe('Monthly Performance Analysis - Audit Log Recording for Missing Report Data', () => {
  // SCEN-2452
  test('should fail audit log recording when analysis date range has no report data', async () => {
    const analysisStartDate = new Date('2026-01-15T00:00:00Z');
    const analysisEndDate = new Date('2026-01-15T23:59:59Z');
    const reporterId = 'user-123';
    
    const result = await validateMonthlyReportApproval({
      analysisStartDate,
      analysisEndDate,
      reporterId,
      reportRecords: [],
    });

    expect(result.isValid).toBe(false);
    expect(result.validationErrors).toBeDefined();
    expect(result.validationErrors).toContain(/NO_REPORT_DATA_FOR_DATE_RANGE/);
  });
});