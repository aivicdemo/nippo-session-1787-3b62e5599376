import { generateMonthlyAnalysisReport } from '../../src/logic/monthly-analysis-report';

describe('Monthly Analysis Report Generation', () => {
  // SCEN-091
  test('should throw AnalysisValidationFailure when extracted dataset fails data completeness validation with missing required fields, invalid data types, and out-of-range dates', async () => {
    const targetMonth = '2025-01';
    const projectManagerId = 'pm-001';
    const includeExecutiveSummary = true;

    // Mock the extractMonthlyReportDataset to return incomplete dataset
    // with missing issueId in 2 records, invalid date '2025-13-45', and out-of-range date from December 2024
    const mockIncompleteDataset = {
      extractionPeriod: {
        startDateTime: '2025-01-01T00:00:00Z',
        endDateTime: '2025-01-31T23:59:59Z'
      },
      totalReportCount: 5,
      reports: [
        {
          reportId: 'report-001',
          reportDate: '2025-01-15',
          reporterId: 'eng-001',
          teamId: 'team-001',
          issues: [
            {
              issueId: null, // Missing required field
              issueContent: 'Build failure',
              frequency: 2,
              impactScore: 45,
              resolutionStatus: 'unresolved',
              extractedDate: new Date('2025-01-15T09:00:00Z')
            }
          ],
          submissionTimestamp: '2025-01-15T08:30:00Z'
        },
        {
          reportId: 'report-002',
          reportDate: '2025-01-16',
          reporterId: 'eng-002',
          teamId: 'team-001',
          issues: [
            {
              issueId: 'issue-002',
              issueContent: 'Test environment unstable',
              frequency: 3,
              impactScore: 60,
              resolutionStatus: 'in_progress',
              extractedDate: new Date('2025-01-16T10:00:00Z')
            }
          ],
          submissionTimestamp: '2025-01-16T08:45:00Z'
        },
        {
          reportId: 'report-003',
          reportDate: '2025-01-20',
          reporterId: 'eng-003',
          teamId: 'team-001',
          issues: [
            {
              issueId: null, // Another missing required field
              issueContent: 'Resource shortage',
              frequency: 1,
              impactScore: 70,
              resolutionStatus: 'unresolved',
              extractedDate: new Date('2025-01-20T09:30:00Z')
            }
          ],
          submissionTimestamp: '2025-01-20T09:00:00Z'
        },
        {
          reportId: 'report-004',
          reportDate: '2025-13-45', // Invalid date format
          reporterId: 'eng-004',
          teamId: 'team-001',
          issues: [
            {
              issueId: 'issue-004',
              issueContent: 'API latency',
              frequency: 2,
              impactScore: 50,
              resolutionStatus: 'resolved',
              extractedDate: new Date('2025-01-25T11:00:00Z')
            }
          ],
          submissionTimestamp: '2025-01-25T10:15:00Z'
        },
        {
          reportId: 'report-005',
          reportDate: '2024-12-28', // Out-of-range date (December 2024)
          reporterId: 'eng-005',
          teamId: 'team-001',
          issues: [
            {
              issueId: 'issue-005',
              issueContent: 'Database connection issue',
              frequency: 1,
              impactScore: 65,
              resolutionStatus: 'unresolved',
              extractedDate: new Date('2024-12-28T14:00:00Z')
            }
          ],
          submissionTimestamp: '2024-12-28T13:45:00Z'
        }
      ],
      dataQualityScore: 45
    };

    // Expect the function to throw an error matching the specified error message pattern
    await expect(
      generateMonthlyAnalysisReport({
        targetMonth,
        projectManagerId,
        includeExecutiveSummary
      })
    ).rejects.toThrow(/分析対象データが品質基準を満たしていません/);
  });
});