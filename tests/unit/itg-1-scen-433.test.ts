import { generateWeeklyAnalysisReport } from '../../src/logic/weekly-analysis-report';
import { type WeeklyAnalysisReportInput } from '../../src/logic/weekly-analysis-report';

describe('generateWeeklyAnalysisReport', () => {
  // SCEN-433
  test('should throw InsufficientReportDataError when no report records exist', () => {
    const analysisStartDate = new Date('2024-01-08T00:00:00Z');
    const analysisEndDate = new Date('2024-01-14T23:59:59Z');
    const teamId = 'team-001';
    const minimumReportThreshold = 5;

    const input: WeeklyAnalysisReportInput = {
      analysisStartDate,
      analysisEndDate,
      teamId,
      aggregatedReportData: {
        reportRecords: [],
        extractedIssues: [],
        dataQualityMetrics: {
          completenessRate: 0,
          deduplicationRate: 0,
          validityRate: 0,
        },
      },
      minimumReportThreshold,
    };

    expect(() => generateWeeklyAnalysisReport(input)).toThrow(
      /分析対象データがありません。前週の日報が正常に集約されているか確認してください/
    );
  });
});