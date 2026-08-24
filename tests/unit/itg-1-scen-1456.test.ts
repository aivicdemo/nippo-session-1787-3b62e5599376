import { extractWeeklyReportData } from '../../src/logic/weekly-issue-analysis';
import { type WeeklyExtractionRequest, type WeeklyReportDataset } from '../../src/logic/weekly-issue-analysis';

describe('Weekly Report Data Extraction with Null Challenge Fields', () => {
  // SCEN-1456
  test('should throw error when challenge field is null in report data', () => {
    // Arrange
    const weekStartDate = new Date('2024-01-08T00:00:00Z');
    const weekEndDate = new Date('2024-01-14T23:59:59Z');
    const requestedByUserId = 'user-001';

    const extractionRequest: WeeklyExtractionRequest = {
      weekStartDate,
      weekEndDate,
      teamIds: ['team-001'],
      requestedByUserId,
    };

    // Act & Assert
    expect(() => {
      extractWeeklyReportData(extractionRequest);
    }).toThrow(/抱えている課題フィールドがnull値/);
  });
});