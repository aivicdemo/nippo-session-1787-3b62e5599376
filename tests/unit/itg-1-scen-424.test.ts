import { describe, test, expect } from '@jest/globals';
import { generateWeeklyAnalysisReport } from '../../src/logic/weekly-analysis-report';
import type { WeeklyAnalysisReportInput, AggregatedWeeklyReportData } from '../../src/logic/weekly-analysis-report';

describe('Weekly Analysis Report Generation', () => {
  // SCEN-424: チームメンバーIDが空のリストのときエラーが発生する
  test('should throw error when teamMemberIds is empty array', () => {
    const analysisStartDate = new Date('2024-01-08T00:00:00Z');
    const analysisEndDate = new Date('2024-01-14T23:59:59Z');
    const teamId = 'team-001';

    const aggregatedReportData: AggregatedWeeklyReportData = {
      reportRecords: [
        {
          reportId: 'report-001',
          reporterId: 'engineer-001',
          reportDate: '2024-01-08',
          reportContent: 'Completed API integration',
          submittedAt: '2024-01-08T08:30:00Z',
        },
        {
          reportId: 'report-002',
          reporterId: 'engineer-002',
          reportDate: '2024-01-09',
          reportContent: 'Fixed database connection issue',
          submittedAt: '2024-01-09T08:15:00Z',
        },
        {
          reportId: 'report-003',
          reporterId: 'engineer-003',
          reportDate: '2024-01-10',
          reportContent: 'Unit tests passed',
          submittedAt: '2024-01-10T08:45:00Z',
        },
        {
          reportId: 'report-004',
          reporterId: 'engineer-004',
          reportDate: '2024-01-11',
          reportContent: 'Code review completed',
          submittedAt: '2024-01-11T08:20:00Z',
        },
        {
          reportId: 'report-005',
          reporterId: 'engineer-005',
          reportDate: '2024-01-12',
          reportContent: 'Deployment preparation',
          submittedAt: '2024-01-12T08:50:00Z',
        },
      ],
      extractedIssues: [
        {
          issueId: 'issue-001',
          issueContent: 'Database connection unstable',
          reporterTeamId: teamId,
          occurrenceCount: 2,
        },
      ],
      dataQualityMetrics: {
        completenessRate: 0.95,
        deduplicationRate: 0.90,
        validityRate: 0.98,
      },
    };

    const input: WeeklyAnalysisReportInput = {
      analysisStartDate,
      analysisEndDate,
      teamId,
      aggregatedReportData,
      minimumReportThreshold: 5,
    };

    expect(() => generateWeeklyAnalysisReport(input)).toThrow(/チームメンバー/);
  });
});