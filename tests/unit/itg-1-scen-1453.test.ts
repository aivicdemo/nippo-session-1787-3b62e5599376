import { extractWeeklyReportData } from '../../src/logic/weekly-issue-analysis';
import { type WeeklyExtractionRequest, type WeeklyReportDataset } from '../../src/logic/weekly-issue-analysis';

describe('Weekly Issue Analysis - extractWeeklyReportData', () => {
  // SCEN-1453
  test('should throw error when report record contains null team member ID', () => {
    const weekStartDate = new Date('2024-01-08T00:00:00Z');
    const weekEndDate = new Date('2024-01-14T23:59:59Z');
    const requestedByUserId = 'user-123';

    const invalidReportData = [
      {
        reportId: 'report-001',
        reportDate: new Date('2024-01-09T09:00:00Z'),
        submittedByUserId: 'member-001',
        yesterdayAccomplishment: 'Fixed bug in login module',
        todayPlan: 'Review pull requests',
        challenges: 'Database connection timeout',
        teamId: 'team-001',
      },
      {
        reportId: 'report-002',
        reportDate: new Date('2024-01-09T09:15:00Z'),
        submittedByUserId: null,
        yesterdayAccomplishment: 'Completed feature X',
        todayPlan: 'Deploy to staging',
        challenges: 'API rate limiting issues',
        teamId: 'team-001',
      },
      {
        reportId: 'report-003',
        reportDate: new Date('2024-01-10T08:45:00Z'),
        submittedByUserId: 'member-003',
        yesterdayAccomplishment: 'Unit tests passed',
        todayPlan: 'Integration testing',
        challenges: 'Memory leak detected',
        teamId: 'team-001',
      },
    ];

    const request: WeeklyExtractionRequest = {
      weekStartDate: weekStartDate,
      weekEndDate: weekEndDate,
      teamIds: ['team-001'],
      requestedByUserId: requestedByUserId,
    };

    expect(() => {
      extractWeeklyReportData(request, invalidReportData as any);
    }).toThrow(/メンバーID|チームメンバーID|無効な日報/);
  });
});