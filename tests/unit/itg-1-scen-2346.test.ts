import { calculateTeamPerformanceMetrics } from '../../src/logic/monthly-performance-analysis';
import { type TeamPerformanceMetricsInput, type TeamPerformanceMetricsOutput } from '../../src/logic/monthly-performance-analysis';

describe('課題解決速度計算機能 - 入力順序と計算精度', () => {
  // SCEN-2346
  test('課題データが解決日数の逆順で入力されるとき、正しい平均値が計算される', () => {
    const aggregationStartDate = '2024-01-01';
    const aggregationEndDate = '2024-01-31';
    const teamId = 'team-001';

    const reportDataset = [
      {
        reportId: 'report-001',
        teamId: teamId,
        submittedAt: '2024-01-05T09:00:00Z',
        yesterday: 'Task A',
        today: 'Task B',
        issues: 'Issue with 15 days resolution',
        reportedIssueIds: ['issue-001'],
      },
      {
        reportId: 'report-002',
        teamId: teamId,
        submittedAt: '2024-01-06T09:00:00Z',
        yesterday: 'Task C',
        today: 'Task D',
        issues: 'Issue with 5 days resolution',
        reportedIssueIds: ['issue-002'],
      },
      {
        reportId: 'report-003',
        teamId: teamId,
        submittedAt: '2024-01-07T09:00:00Z',
        yesterday: 'Task E',
        today: 'Task F',
        issues: 'Issue with 20 days resolution',
        reportedIssueIds: ['issue-003'],
      },
      {
        reportId: 'report-004',
        teamId: teamId,
        submittedAt: '2024-01-08T09:00:00Z',
        yesterday: 'Task G',
        today: 'Task H',
        issues: 'Issue with 10 days resolution',
        reportedIssueIds: ['issue-004'],
      },
      {
        reportId: 'report-005',
        teamId: teamId,
        submittedAt: '2024-01-09T09:00:00Z',
        yesterday: 'Task I',
        today: 'Task J',
        issues: 'Issue with 3 days resolution',
        reportedIssueIds: ['issue-005'],
      },
    ];

    const issueResolutionData = [
      {
        issueId: 'issue-001',
        reportedDate: new Date('2024-01-05T09:00:00Z'),
        resolvedDate: new Date('2024-01-20T17:00:00Z'),
        resolutionDays: 15,
      },
      {
        issueId: 'issue-002',
        reportedDate: new Date('2024-01-06T09:00:00Z'),
        resolvedDate: new Date('2024-01-11T17:00:00Z'),
        resolutionDays: 5,
      },
      {
        issueId: 'issue-003',
        reportedDate: new Date('2024-01-07T09:00:00Z'),
        resolvedDate: new Date('2024-01-27T17:00:00Z'),
        resolutionDays: 20,
      },
      {
        issueId: 'issue-004',
        reportedDate: new Date('2024-01-08T09:00:00Z'),
        resolvedDate: new Date('2024-01-18T17:00:00Z'),
        resolutionDays: 10,
      },
      {
        issueId: 'issue-005',
        reportedDate: new Date('2024-01-09T09:00:00Z'),
        resolvedDate: new Date('2024-01-12T17:00:00Z'),
        resolutionDays: 3,
      },
    ];

    const input: TeamPerformanceMetricsInput = {
      aggregationStartDate: new Date(aggregationStartDate),
      aggregationEndDate: new Date(aggregationEndDate),
      teamIds: [teamId],
      reportRecords: reportDataset,
    };

    const result: TeamPerformanceMetricsOutput = calculateTeamPerformanceMetrics(input);

    const teamMetric = result.teamMetrics.find((metric) => metric.teamId === teamId);
    expect(teamMetric).toBeDefined();
    expect(teamMetric!.issueResolutionSpeed).toBe(10.6);
  });
});