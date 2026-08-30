import { generateWeeklyAnalysisReport } from '../../src/logic/weekly-analysis-report';
import { type WeeklyAnalysisReportInput, type AggregatedWeeklyReportData } from '../../src/logic/weekly-analysis-report';

describe('generateWeeklyAnalysisReport', () => {
  // SCEN-430
  test('should throw InvalidAnalysisPeriodError when analysisStartDate is after analysisEndDate', () => {
    const aggregatedReportData: AggregatedWeeklyReportData = {
      reportRecords: [
        {
          reportId: 'report-001',
          employeeId: 'emp-001',
          reportDate: '2024-01-08',
          yesterday: 'Completed API development',
          today: 'Testing and bug fixes',
          issues: 'Database connection timeout',
          submittedAt: '2024-01-08T08:00:00Z',
        },
        {
          reportId: 'report-002',
          employeeId: 'emp-002',
          reportDate: '2024-01-09',
          yesterday: 'Frontend component updates',
          today: 'Integration testing',
          issues: 'Memory leak in cache',
          submittedAt: '2024-01-09T08:15:00Z',
        },
      ],
      extractedIssues: [
        {
          issueId: 'issue-001',
          issueContent: 'Database connection timeout',
          reporterTeamId: 'team-001',
          occurrenceCount: 1,
        },
        {
          issueId: 'issue-002',
          issueContent: 'Memory leak in cache',
          reporterTeamId: 'team-001',
          occurrenceCount: 1,
        },
      ],
      dataQualityMetrics: {
        completenessRate: 0.95,
        deduplicationRate: 0.98,
        validityRate: 0.97,
      },
    };

    const input: WeeklyAnalysisReportInput = {
      analysisStartDate: new Date('2024-01-14T00:00:00Z'),
      analysisEndDate: new Date('2024-01-08T00:00:00Z'),
      teamId: 'team-001',
      aggregatedReportData,
      minimumReportThreshold: 5,
    };

    expect(() => generateWeeklyAnalysisReport(input)).toThrow(/分析対象期間/);
  });
});