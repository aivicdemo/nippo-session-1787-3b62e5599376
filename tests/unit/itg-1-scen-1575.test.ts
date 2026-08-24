import { generateWeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';
import { type WeeklyAnalysisReportInput, type WeeklyAnalysisReport } from '../../src/logic/weekly-issue-analysis';

describe('Weekly Issue Analysis Report Generation - Missing Frequency Field', () => {
  // SCEN-1575
  test('should return validation error when extracted keywords lack occurrence frequency field', () => {
    const analysisStartDate = '2024-01-15';
    const analysisEndDate = '2024-01-21';
    const teamId = 'team-001';

    const extractedIssuesWithMissingFrequency = [
      {
        keyword: '課題A',
        severity: 'high' as const,
        impactScore: 75,
      },
      {
        keyword: '課題B',
        severity: 'medium' as const,
        impactScore: 50,
      },
    ];

    const input: WeeklyAnalysisReportInput = {
      aggregationStartDate: analysisStartDate,
      aggregationEndDate: analysisEndDate,
      extractedIssues: extractedIssuesWithMissingFrequency as any,
      teamId: teamId,
    };

    expect(() => generateWeeklyAnalysisReport(input)).toThrow(/frequency|occurrence|頻度/i);
  });
});