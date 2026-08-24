import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';

describe('monthly-performance-analysis', () => {
  // SCEN-1758
  test('should return empty dataset when no report data exists in extraction period', async () => {
    // Setup: Create input for August 2026 with no report data
    const input: MonthlyExtractionRequest = {
      targetYear: 2026,
      targetMonth: 8,
      requestedByUserId: 'test-user-001',
      teamIdFilter: undefined,
    };

    // Execute: Call the extraction function
    const result: MonthlyReportDataset = await extractMonthlyReportData(input);

    // Verify: Check that dataset is empty with correct period information
    expect(result).toBeDefined();
    expect(result.totalReportCount).toBe(0);
    expect(result.reportsByTeam).toEqual([]);
    expect(result.extractionPeriodStart).toBe('2026-08-01T00:00:00Z');
    expect(result.extractionPeriodEnd).toBe('2026-08-31T23:59:59Z');
    expect(typeof result.dataQualityScore).toBe('number');
    expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);
    expect(result.extractedAt).toBeDefined();
  });
});