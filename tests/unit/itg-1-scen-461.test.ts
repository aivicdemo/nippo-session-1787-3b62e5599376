import { describe, test, expect } from '@jest/globals';
import { generateMonthlyAnalysisReport } from '../../src/logic/monthly-analysis-report';
import type { MonthlyReportGenerationRequest, MonthlyReportDataset, MonthlyReport, ExtractedIssue } from '../../src/logic/monthly-analysis-report';

describe('generateMonthlyAnalysisReport', () => {
  // SCEN-461
  test('should throw error when monthly report dataset contains no issues', async () => {
    const emptyDataset: MonthlyReportDataset = {
      extractionPeriod: {
        startDateTime: '2024-12-01T00:00:00Z',
        endDateTime: '2024-12-31T23:59:59Z'
      },
      totalReportCount: 2,
      reports: [
        {
          reportId: 'RPT-001',
          reportDate: '2024-12-15',
          reporterId: 'ENG-001',
          teamId: 'TEAM-A',
          issues: [],
          submissionTimestamp: '2024-12-15T09:00:00Z'
        },
        {
          reportId: 'RPT-002',
          reportDate: '2024-12-20',
          reporterId: 'ENG-002',
          teamId: 'TEAM-A',
          issues: [],
          submissionTimestamp: '2024-12-20T09:00:00Z'
        }
      ] as MonthlyReport[],
      dataQualityScore: 45
    };

    const request: MonthlyReportGenerationRequest = {
      targetMonth: '2025-01',
      projectManagerId: 'PM-001',
      includeExecutiveSummary: true,
      topChallengesCount: 5
    };

    expect(() => generateMonthlyAnalysisReport(request, emptyDataset)).toThrow(/課題情報/);
  });
});