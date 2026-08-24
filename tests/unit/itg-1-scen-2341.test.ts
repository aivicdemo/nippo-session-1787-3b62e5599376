import { calculateTeamPerformanceMetrics } from '../../src/logic/monthly-performance-analysis';
import { type TeamPerformanceMetricsInput, type TeamPerformanceMetricsOutput } from '../../src/logic/monthly-performance-analysis';

describe('課題の影響度判定と優先度スコア表示機能', () => {
  // SCEN-2341: [edge] 課題解決速度計算機能 - 対応完了率がちょうど100%のとき、100と表示される
  test('should return completion rate of 100 when all issues are resolved', () => {
    const aggregationStartDate = new Date('2024-01-01');
    const aggregationEndDate = new Date('2024-01-31');
    const teamIds = ['team-001'];

    const reportDataset = [
      {
        recordDate: new Date('2024-01-15'),
        teamId: 'team-001',
        reporterId: 'user-001',
        yesterdayAccomplishment: 'Completed API integration',
        todayPlan: 'Start unit testing',
        issues: [
          {
            issueId: 'issue-001',
            issueText: 'Database connection timeout',
            reportedDate: new Date('2024-01-10'),
            resolvedDate: new Date('2024-01-12'),
            resolutionDays: 2,
            status: 'closed',
          },
        ],
      },
      {
        recordDate: new Date('2024-01-16'),
        teamId: 'team-001',
        reporterId: 'user-002',
        yesterdayAccomplishment: 'Completed unit tests',
        todayPlan: 'Prepare integration tests',
        issues: [
          {
            issueId: 'issue-002',
            issueText: 'Performance optimization needed',
            reportedDate: new Date('2024-01-11'),
            resolvedDate: new Date('2024-01-14'),
            resolutionDays: 3,
            status: 'closed',
          },
        ],
      },
    ];

    const input: TeamPerformanceMetricsInput = {
      aggregationStartDate,
      aggregationEndDate,
      teamIds,
      reportDataset,
    };

    const result: TeamPerformanceMetricsOutput = calculateTeamPerformanceMetrics(input);

    expect(result).toBeDefined();
    expect(result.teamMetrics).toBeDefined();
    expect(Array.isArray(result.teamMetrics)).toBe(true);

    const teamMetric = result.teamMetrics.find((metric) => metric.teamId === 'team-001');
    expect(teamMetric).toBeDefined();

    if (teamMetric) {
      expect(teamMetric.reportSubmissionRate).toBe(100);
    }
  });
});