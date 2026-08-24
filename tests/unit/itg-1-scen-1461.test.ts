import { extractWeeklyReportData } from '../../src/logic/weekly-issue-analysis';
import { type WeeklyExtractionRequest } from '../../src/logic/weekly-issue-analysis';

describe('Weekly Report Data Extraction - System Operation Date Validation', () => {
  // SCEN-1461
  test('should throw error when aggregation period is before system start date', () => {
    const systemStartDate = new Date('2026-01-01T00:00:00Z');
    
    const weeklyExtractionRequest: WeeklyExtractionRequest = {
      weekStartDate: new Date('2025-12-22T00:00:00Z'),
      weekEndDate: new Date('2025-12-28T23:59:59Z'),
      teamIds: ['team-001'],
      requestedByUserId: 'user-001',
    };

    expect(() => 
      extractWeeklyReportData(weeklyExtractionRequest, systemStartDate)
    ).toThrow(/システム稼働前/);
  });
});