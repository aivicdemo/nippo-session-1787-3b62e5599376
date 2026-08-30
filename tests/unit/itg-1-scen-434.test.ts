import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { generateWeeklyAnalysisReport } from '../../src/logic/weekly-analysis-report';

describe('Weekly Analysis Report Generation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-434
  test('should throw DataQualityValidationError when valid record count is less than 50% of minimum threshold', async () => {
    const analysisStartDate = new Date('2024-01-08T00:00:00Z');
    const analysisEndDate = new Date('2024-01-14T23:59:59Z');
    const teamId = 'team-001';
    const minimumReportThreshold = 5;

    const aggregatedReportData = {
      reportRecords: [
        {
          reportId: 'report-001',
          reporterId: 'emp-001',
          reportDate: '2024-01-08',
          reportContent: 'Worked on feature A',
          submittedAt: '2024-01-08T08:00:00Z'
        },
        {
          reportId: 'report-002',
          reporterId: 'emp-002',
          reportDate: '2024-01-09',
          reportContent: 'Worked on feature B',
          submittedAt: '2024-01-09T08:00:00Z'
        },
        {
          reportId: 'report-003',
          reporterId: 'emp-003',
          reportDate: '2024-01-10',
          reportContent: '',
          submittedAt: '2024-01-10T08:00:00Z'
        },
        {
          reportId: 'report-004',
          reporterId: 'emp-004',
          reportDate: '2024-01-11',
          reportContent: '',
          submittedAt: '2024-01-11T08:00:00Z'
        },
        {
          reportId: 'report-005',
          reporterId: 'emp-005',
          reportDate: '2024-01-12',
          reportContent: '',
          submittedAt: '2024-01-12T08:00:00Z'
        }
      ],
      extractedIssues: [],
      dataQualityMetrics: {
        completenessRate: 0.75,
        deduplicationRate: 1.0,
        validityRate: 0.8
      }
    };

    const inputData = {
      analysisStartDate,
      analysisEndDate,
      teamId,
      aggregatedReportData,
      minimumReportThreshold
    };

    expect(() => {
      generateWeeklyAnalysisReport(inputData);
    }).toThrow(/品質が基準を満たしていません/);
  });
});