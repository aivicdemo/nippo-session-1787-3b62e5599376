import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';

describe('monthly-performance-analysis', () => {
  // SCEN-1771
  test('extractMonthlyReportData should fail when extractionPeriodEnd does not match the previous month last day 23:59:00', () => {
    // Arrange
    const targetYear = 2026;
    const targetMonth = 2;
    const requestedByUserId = 'user-001';
    
    // Expected normal extraction period: 2026-02-01T00:00:00Z to 2026-01-31T23:59:00Z
    // (前月末日23:59が正常値)
    const invalidExtractionPeriodEnd = new Date('2026-01-31T23:58:59Z');
    
    const input = {
      targetYear,
      targetMonth,
      requestedByUserId,
      teamIdFilter: undefined,
    };

    // Act & Assert
    expect(() => {
      extractMonthlyReportData(
        input,
        invalidExtractionPeriodEnd
      );
    }).toThrow(/抽出終了日時が指定月の前月末日23:59と一致していません/);
  });
});