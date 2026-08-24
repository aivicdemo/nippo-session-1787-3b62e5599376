import { extractMonthlyReportData } from '../../src/logic/monthly-performance-analysis';

describe('Monthly Performance Analysis - extractMonthlyReportData', () => {
  test('SCEN-1765: should throw ValidationError when extractionPeriodStart is null', () => {
    const invalidInput = {
      extractionPeriodStart: null,
      extractionPeriodEnd: '2024-01-31T23:59:59Z',
      requestedByUserId: 'user-001',
      teamIdFilter: ['team-A', 'team-B'],
    };

    expect(() => extractMonthlyReportData(invalidInput)).toThrow(/抽出開始日時|startDateTime/);
  });
});