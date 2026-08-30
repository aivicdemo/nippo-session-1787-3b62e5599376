import { calculateTeamPerformanceMetrics, type TeamPerformanceMetricsOutput, type MonthlyReportDataset } from '../../src/logic/monthly-analysis-report';

describe('calculateTeamPerformanceMetrics', () => {
  // SCEN-092
  test('should calculate team performance metrics for multiple teams with aggregation period and return structured output', () => {
    const teamIds = ['team-001', 'team-002'];
    const aggregationStartDate = new Date('2024-01-01T00:00:00Z');
    const aggregationEndDate = new Date('2024-01-31T23:59:59Z');

    const reportDataset: MonthlyReportDataset = {
      extractionPeriod: {
        startDateTime: '2024-01-01T00:00:00Z',
        endDateTime: '2024-01-31T23:59:59Z',
      },
      totalReportCount: 10,
      reports: [
        {
          reportId: 'report-001',
          reportDate: '2024-01-05',
          reporterId: 'eng-001',
          teamId: 'team-001',
          issues: [
            {
              issueId: 'issue-001',
              keyword: 'バグ',
              frequency: 2,
              impactScore: 45,
              resolutionStatus: 'resolved',
              extractedDate: new Date('2024-01-05'),
            },
          ],
          submissionTimestamp: '2024-01-05T08:30:00Z',
        },
        {
          reportId: 'report-002',
          reportDate: '2024-01-06',
          reporterId: 'eng-002',
          teamId: 'team-001',
          issues: [
            {
              issueId: 'issue-002',
              keyword: 'テスト失敗',
              frequency: 1,
              impactScore: 30,
              resolutionStatus: 'in_progress',
              extractedDate: new Date('2024-01-06'),
            },
          ],
          submissionTimestamp: '2024-01-06T08:45:00Z',
        },
        {
          reportId: 'report-003',
          reportDate: '2024-01-07',
          reporterId: 'eng-003',
          teamId: 'team-001',
          issues: [
            {
              issueId: 'issue-003',
              keyword: 'バグ',
              frequency: 1,
              impactScore: 50,
              resolutionStatus: 'unresolved',
              extractedDate: new Date('2024-01-07'),
            },
          ],
          submissionTimestamp: '2024-01-07T09:00:00Z',
        },
        {
          reportId: 'report-004',
          reportDate: '2024-01-08',
          reporterId: 'eng-004',
          teamId: 'team-001',
          issues: [
            {
              issueId: 'issue-004',
              keyword: 'ビルド失敗',
              frequency: 3,
              impactScore: 65,
              resolutionStatus: 'resolved',
              extractedDate: new Date('2024-01-08'),
            },
          ],
          submissionTimestamp: '2024-01-08T08:15:00Z',
        },
        {
          reportId: 'report-005',
          reportDate: '2024-01-09',
          reporterId: 'eng-001',
          teamId: 'team-001',
          issues: [
            {
              issueId: 'issue-005',
              keyword: 'テスト失敗',
              frequency: 2,
              impactScore: 35,
              resolutionStatus: 'resolved',
              extractedDate: new Date('2024-01-09'),
            },
          ],
          submissionTimestamp: '2024-01-09T08:50:00Z',
        },
        {
          reportId: 'report-006',
          reportDate: '2024-01-10',
          reporterId: 'eng-005',
          teamId: 'team-002',
          issues: [
            {
              issueId: 'issue-006',
              keyword: 'リソース不足',
              frequency: 1,
              impactScore: 75,
              resolutionStatus: 'in_progress',
              extractedDate: new Date('2024-01-10'),
            },
          ],
          submissionTimestamp: '2024-01-10T08:20:00Z',
        },
        {
          reportId: 'report-007',
          reportDate: '2024-01-11',
          reporterId: 'eng-006',
          teamId: 'team-002',
          issues: [
            {
              issueId: 'issue-007',
              keyword: 'バグ',
              frequency: 2,
              impactScore: 40,
              resolutionStatus: 'resolved',
              extractedDate: new Date('2024-01-11'),
            },
          ],
          submissionTimestamp: '2024-01-11T08:35:00Z',
        },
        {
          reportId: 'report-008',
          reportDate: '2024-01-12',
          reporterId: 'eng-007',
          teamId: 'team-002',
          issues: [
            {
              issueId: 'issue-008',
              keyword: 'リソース不足',
              frequency: 1,
              impactScore: 60,
              resolutionStatus: 'unresolved',
              extractedDate: new Date('2024-01-12'),
            },
          ],
          submissionTimestamp: '2024-01-12T09:05:00Z',
        },
        {
          reportId: 'report-009',
          reportDate: '2024-01-13',
          reporterId: 'eng-008',
          teamId: 'team-002',
          issues: [
            {
              issueId: 'issue-009',
              keyword: 'ビルド失敗',
              frequency: 1,
              impactScore: 55,
              resolutionStatus: 'resolved',
              extractedDate: new Date('2024-01-13'),
            },
          ],
          submissionTimestamp: '2024-01-13T08:40:00Z',
        },
        {
          reportId: 'report-010',
          reportDate: '2024-01-14',
          reporterId: 'eng-009',
          teamId: 'team-002',
          issues: [
            {
              issueId: 'issue-010',
              keyword: 'テスト失敗',
              frequency: 1,
              impactScore: 25,
              resolutionStatus: 'resolved',
              extractedDate: new Date('2024-01-14'),
            },
          ],
          submissionTimestamp: '2024-01-14T08:55:00Z',
        },
      ],
      dataQualityScore: 85,
    };

    const result: TeamPerformanceMetricsOutput = calculateTeamPerformanceMetrics(
      teamIds,
      aggregationStartDate,
      aggregationEndDate,
      reportDataset
    );

    expect(result).toBeDefined();
    expect(result.teamMetrics).toBeDefined();
    expect(Array.isArray(result.teamMetrics)).toBe(true);
    expect(result.teamMetrics.length).toBe(2);

    expect(result.aggregationPeriod).toBeDefined();
    expect(result.aggregationPeriod.startDate).toEqual(aggregationStartDate);
    expect(result.aggregationPeriod.endDate).toEqual(aggregationEndDate);

    expect(result.calculationTimestamp).toBeDefined();
    expect(result.calculationTimestamp instanceof Date).toBe(true);

    const team001Metric = result.teamMetrics.find((metric) => metric.teamId === 'team-001');
    expect(team001Metric).toBeDefined();
    expect(team001Metric?.issueResolutionSpeedDays).toBeGreaterThanOrEqual(0);
    expect(team001Metric?.issueResolutionSpeedDays).toBeLessThanOrEqual(999);
    expect(team001Metric?.reportSubmissionRate).toBeGreaterThanOrEqual(0);
    expect(team001Metric?.reportSubmissionRate).toBeLessThanOrEqual(100);
    expect(team001Metric?.issueRecurrenceRate).toBeGreaterThanOrEqual(0);
    expect(team001Metric?.issueRecurrenceRate).toBeLessThanOrEqual(100);
    expect(team001Metric?.priorityScore).toBeGreaterThanOrEqual(0);
    expect(team001Metric?.priorityScore).toBeLessThanOrEqual(100);
    expect(['high', 'medium', 'low']).toContain(team001Metric?.performanceRank);

    const team002Metric = result.teamMetrics.find((metric) => metric.teamId === 'team-002');
    expect(team002Metric).toBeDefined();
    expect(team002Metric?.issueResolutionSpeedDays).toBeGreaterThanOrEqual(0);
    expect(team002Metric?.issueResolutionSpeedDays).toBeLessThanOrEqual(999);
    expect(team002Metric?.reportSubmissionRate).toBeGreaterThanOrEqual(0);
    expect(team002Metric?.reportSubmissionRate).toBeLessThanOrEqual(100);
    expect(team002Metric?.issueRecurrenceRate).toBeGreaterThanOrEqual(0);
    expect(team002Metric?.issueRecurrenceRate).toBeLessThanOrEqual(100);
    expect(team002Metric?.priorityScore).toBeGreaterThanOrEqual(0);
    expect(team002Metric?.priorityScore).toBeLessThanOrEqual(100);
    expect(['high', 'medium', 'low']).toContain(team002Metric?.performanceRank);
  });
});