import { generateMonthlyAnalysisReport } from '../../src/logic/monthly-analysis-report';
import { type MonthlyReportGenerationRequest, type MonthlyAnalysisReportResult } from '../../src/logic/monthly-analysis-report';

describe('generateMonthlyAnalysisReport', () => {
  // SCEN-468
  test('should throw AnalysisValidationFailure when team members list is empty', async () => {
    const request: MonthlyReportGenerationRequest = {
      targetMonth: '2024-11',
      projectManagerId: 'pm-001',
      includeExecutiveSummary: true,
      topChallengesCount: 5,
    };

    const mockReportDataset = {
      extractionPeriod: {
        startDateTime: '2024-11-01T00:00:00Z',
        endDateTime: '2024-11-30T23:59:59Z',
      },
      totalReportCount: 3,
      reports: [
        {
          reportId: 'report-001',
          reportDate: '2024-11-01',
          reporterId: 'eng-001',
          teamId: 'team-001',
          issues: [
            {
              issueId: 'issue-001',
              keyword: 'バグ',
              frequency: 2,
              impactScore: 75,
              resolutionStatus: 'unresolved',
            },
          ],
          submissionTimestamp: '2024-11-01T08:00:00Z',
        },
        {
          reportId: 'report-002',
          reportDate: '2024-11-02',
          reporterId: 'eng-002',
          teamId: 'team-001',
          issues: [
            {
              issueId: 'issue-002',
              keyword: '遅延',
              frequency: 1,
              impactScore: 60,
              resolutionStatus: 'in_progress',
            },
          ],
          submissionTimestamp: '2024-11-02T08:15:00Z',
        },
        {
          reportId: 'report-003',
          reportDate: '2024-11-03',
          reporterId: 'eng-003',
          teamId: 'team-001',
          issues: [
            {
              issueId: 'issue-003',
              keyword: 'リソース不足',
              frequency: 3,
              impactScore: 85,
              resolutionStatus: 'unresolved',
            },
          ],
          submissionTimestamp: '2024-11-03T08:30:00Z',
        },
      ],
      dataQualityScore: 85,
    };

    const emptyTeamMembers = [];

    await expect(
      generateMonthlyAnalysisReport(request, mockReportDataset, emptyTeamMembers)
    ).rejects.toThrow(/チームメンバー情報/);
  });
});