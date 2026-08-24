import { extractWeeklyReportData } from '../../src/logic/weekly-issue-analysis';
import { type WeeklyExtractionRequest, type WeeklyReportDataset } from '../../src/logic/weekly-issue-analysis';

describe('Weekly Report Data Extraction - Today Field Validation', () => {
  // SCEN-1455
  test('should throw validation error when today field is empty string', () => {
    const testRequest: WeeklyExtractionRequest = {
      weekStartDate: new Date('2024-01-08T00:00:00Z'),
      weekEndDate: new Date('2024-01-14T23:59:59Z'),
      teamIds: ['team001'],
      requestedByUserId: 'manager001'
    };

    const malformedReportData = {
      userId: 'user001',
      yesterday: '昨日の作業内容',
      today: '',
      issue: '抱えている課題'
    };

    expect(() => {
      extractWeeklyReportData(testRequest, [malformedReportData]);
    }).toThrow(/今日やること/);
  });
});