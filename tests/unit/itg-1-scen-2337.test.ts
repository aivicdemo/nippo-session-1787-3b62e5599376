import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { calculateTeamPerformanceMetrics } from '../../src/logic/monthly-performance-analysis';
import type { TeamPerformanceMetricsInput, TeamPerformanceMetricsOutput, DailyReportRecord } from '../../src/logic/monthly-performance-analysis';

describe('calculateTeamPerformanceMetrics', () => {
  // SCEN-2337
  test('should correctly aggregate data across fiscal year boundary when aggregation period spans from December to January', () => {
    const aggregationStartDate = new Date('2024-12-01T00:00:00Z');
    const aggregationEndDate = new Date('2025-01-31T23:59:59Z');
    const teamIds = ['team-001'];

    const fy2024Dataset: DailyReportRecord[] = [
      {
        reportId: 'report-2024-01',
        reportDate: new Date('2024-12-01T09:00:00Z'),
        teamId: 'team-001',
        memberId: 'member-001',
        yesterdayAccomplishment: 'Completed feature A',
        todayPlan: 'Start feature B',
        issues: 'Issue 1',
        issueResolutionDate: new Date('2024-12-05T18:00:00Z'),
        resolutionDaysElapsed: 4,
        reportSubmittedAt: new Date('2024-12-01T09:00:00Z'),
      },
      {
        reportId: 'report-2024-02',
        reportDate: new Date('2024-12-02T09:00:00Z'),
        teamId: 'team-001',
        memberId: 'member-002',
        yesterdayAccomplishment: 'Completed test cases',
        todayPlan: 'Code review',
        issues: 'Issue 2',
        issueResolutionDate: new Date('2024-12-08T18:00:00Z'),
        resolutionDaysElapsed: 6,
        reportSubmittedAt: new Date('2024-12-02T09:00:00Z'),
      },
      {
        reportId: 'report-2024-03',
        reportDate: new Date('2024-12-03T09:00:00Z'),
        teamId: 'team-001',
        memberId: 'member-003',
        yesterdayAccomplishment: 'Deploy to staging',
        todayPlan: 'Monitor logs',
        issues: 'Issue 3',
        issueResolutionDate: new Date('2024-12-10T18:00:00Z'),
        resolutionDaysElapsed: 7,
        reportSubmittedAt: new Date('2024-12-03T09:00:00Z'),
      },
      {
        reportId: 'report-2024-04',
        reportDate: new Date('2024-12-04T09:00:00Z'),
        teamId: 'team-001',
        memberId: 'member-004',
        yesterdayAccomplishment: 'Database migration',
        todayPlan: 'Backup verification',
        issues: 'Issue 4',
        issueResolutionDate: new Date('2024-12-09T18:00:00Z'),
        resolutionDaysElapsed: 5,
        reportSubmittedAt: new Date('2024-12-04T09:00:00Z'),
      },
      {
        reportId: 'report-2024-05',
        reportDate: new Date('2024-12-05T09:00:00Z'),
        teamId: 'team-001',
        memberId: 'member-005',
        yesterdayAccomplishment: 'Security audit',
        todayPlan: 'Fix vulnerabilities',
        issues: 'Issue 5',
        issueResolutionDate: new Date('2024-12-12T18:00:00Z'),
        resolutionDaysElapsed: 7,
        reportSubmittedAt: new Date('2024-12-05T09:00:00Z'),
      },
      {
        reportId: 'report-2024-06',
        reportDate: new Date('2024-12-10T09:00:00Z'),
        teamId: 'team-001',
        memberId: 'member-006',
        yesterdayAccomplishment: 'API documentation',
        todayPlan: 'Release notes',
        issues: 'Issue 6',
        issueResolutionDate: new Date('2024-12-15T18:00:00Z'),
        resolutionDaysElapsed: 5,
        reportSubmittedAt: new Date('2024-12-10T09:00:00Z'),
      },
      {
        reportId: 'report-2024-07',
        reportDate: new Date('2024-12-11T09:00:00Z'),
        teamId: 'team-001',
        memberId: 'member-007',
        yesterdayAccomplishment: 'Performance testing',
        todayPlan: 'Optimization',
        issues: 'Issue 7',
        issueResolutionDate: new Date('2024-12-16T18:00:00Z'),
        resolutionDaysElapsed: 5,
        reportSubmittedAt: new Date('2024-12-11T09:00:00Z'),
      },
      {
        reportId: 'report-2024-08',
        reportDate: new Date('2024-12-15T09:00:00Z'),
        teamId: 'team-001',
        memberId: 'member-008',
        yesterdayAccomplishment: 'User feedback review',
        todayPlan: 'Implement changes',
        issues: 'Issue 8',
        issueResolutionDate: new Date('2024-12-20T18:00:00Z'),
        resolutionDaysElapsed: 5,
        reportSubmittedAt: new Date('2024-12-15T09:00:00Z'),
      },
      {
        reportId: 'report-2024-09',
        reportDate: new Date('2024-12-20T09:00:00Z'),
        teamId: 'team-001',
        memberId: 'member-009',
        yesterdayAccomplishment: 'System monitoring',
        todayPlan: 'Alert tuning',
        issues: 'Issue 9',
        issueResolutionDate: new Date('2024-12-27T18:00:00Z'),
        resolutionDaysElapsed: 7,
        reportSubmittedAt: new Date('2024-12-20T09:00:00Z'),
      },
      {
        reportId: 'report-2024-10',
        reportDate: new Date('2024-12-25T09:00:00Z'),
        teamId: 'team-001',
        memberId: 'member-010',
        yesterdayAccomplishment: 'Documentation update',
        todayPlan: 'Knowledge sharing',
        issues: 'Issue 10',
        issueResolutionDate: new Date('2024-12-31T18:00:00Z'),
        resolutionDaysElapsed: 6,
        reportSubmittedAt: new Date('2024-12-25T09:00:00Z'),
      },
    ];

    const fy2025Dataset: DailyReportRecord[] = [
      {
        reportId: 'report-2025-01',
        reportDate: new Date('2025-01-01T09:00:00Z'),
        teamId: 'team-001',
        memberId: 'member-011',
        yesterdayAccomplishment: 'Year review',
        todayPlan: 'Q1 planning',
        issues: 'Issue 11',
        issueResolutionDate: new Date('2025-01-06T18:00:00Z'),
        resolutionDaysElapsed: 5,
        reportSubmittedAt: new Date('2025-01-01T09:00:00Z'),
      },
      {
        reportId: 'report-2025-02',
        reportDate: new Date('2025-01-05T09:00:00Z'),
        teamId: 'team-001',
        memberId: 'member-012',
        yesterdayAccomplishment: 'Backlog grooming',
        todayPlan: 'Sprint planning',
        issues: 'Issue 12',
        issueResolutionDate: new Date('2025-01-12T18:00:00Z'),
        resolutionDaysElapsed: 7,
        reportSubmittedAt: new Date('2025-01-05T09:00:00Z'),
      },
      {
        reportId: 'report-2025-03',
        reportDate: new Date('2025-01-10T09:00:00Z'),
        teamId: 'team-001',
        memberId: 'member-013',
        yesterdayAccomplishment: 'Sprint execution',
        todayPlan: 'Daily standup',
        issues: 'Issue 13',
        issueResolutionDate: new Date('2025-01-15T18:00:00Z'),
        resolutionDaysElapsed: 5,
        reportSubmittedAt: new Date('2025-01-10T09:00:00Z'),
      },
      {
        reportId: 'report-2025-04',
        reportDate: new Date('2025-01-15T09:00:00Z'),
        teamId: 'team-001',
        memberId: 'member-014',
        yesterdayAccomplishment: 'Review results',
        todayPlan: 'Adjust course',
        issues: 'Issue 14',
        issueResolutionDate: new Date('2025-01-22T18:00:00Z'),
        resolutionDaysElapsed: 7,
        reportSubmittedAt: new Date('2025-01-15T09:00:00Z'),
      },
      {
        reportId: 'report-2025-05',
        reportDate: new Date('2025-01-20T09:00:00Z'),
        teamId: 'team-001',
        memberId: 'member-015',
        yesterdayAccomplishment: 'Customer feedback',
        todayPlan: 'Update features',
        issues: 'Issue 15',
        issueResolutionDate: new Date('2025-01-25T18:00:00Z'),
        resolutionDaysElapsed: 5,
        reportSubmittedAt: new Date('2025-01-20T09:00:00Z'),
      },
      {
        reportId: 'report-2025-06',
        reportDate: new Date('2025-01-25T09:00:00Z'),
        teamId: 'team-001',
        memberId: 'member-001',
        yesterdayAccomplishment: 'Testing phase',
        todayPlan: 'Bug fixing',
        issues: 'Issue 16',
        issueResolutionDate: new Date('2025-02-01T18:00:00Z'),
        resolutionDaysElapsed: 7,
        reportSubmittedAt: new Date('2025-01-25T09:00:00Z'),
      },
      {
        reportId: 'report-2025-07',
        reportDate: new Date('2025-02-01T09:00:00Z'),
        teamId: 'team-001',
        memberId: 'member-002',
        yesterdayAccomplishment: 'Regression testing',
        todayPlan: 'Release preparation',
        issues: 'Issue 17',
        issueResolutionDate: new Date('2025-02-06T18:00:00Z'),
        resolutionDaysElapsed: 5,
        reportSubmittedAt: new Date('2025-02-01T09:00:00Z'),
      },
      {
        reportId: 'report-2025-08',
        reportDate: new Date('2025-02-10T09:00:00Z'),
        teamId: 'team-001',
        memberId: 'member-003',
        yesterdayAccomplishment: 'Deployment',
        todayPlan: 'Monitoring',
        issues: 'Issue 18',
        issueResolutionDate: new Date('2025-02-15T18:00:00Z'),
        resolutionDaysElapsed: 5,
        reportSubmittedAt: new Date('2025-02-10T09:00:00Z'),
      },
      {
        reportId: 'report-2025-09',
        reportDate: new Date('2025-02-20T09:00:00Z'),
        teamId: 'team-001',
        memberId: 'member-004',
        yesterdayAccomplishment: 'Post-deployment',
        todayPlan: 'Issue resolution',
        issues: 'Issue 19',
        issueResolutionDate: new Date('2025-02-27T18:00:00Z'),
        resolutionDaysElapsed: 7,
        reportSubmittedAt: new Date('2025-02-20T09:00:00Z'),
      },
      {
        reportId: 'report-2025-10',
        reportDate: new Date('2025-03-01T09:00:00Z'),
        teamId: 'team-001',
        memberId: 'member-005',
        yesterdayAccomplishment: 'Stabilization',
        todayPlan: 'Quarter review',
        issues: 'Issue 20',
        issueResolutionDate: new Date('2025-03-08T18:00:00Z'),
        resolutionDaysElapsed: 7,
        reportSubmittedAt: new Date('2025-03-01T09:00:00Z'),
      },
    ];

    const combinedReportDataset = [...fy2024Dataset, ...fy2025Dataset];

    const input: TeamPerformanceMetricsInput = {
      aggregationStartDate,
      aggregationEndDate,
      teamIds,
      reportRecords: combinedReportDataset,
    };

    const result: TeamPerformanceMetricsOutput = calculateTeamPerformanceMetrics(input);

    expect(result).toBeDefined();
    expect(result.teamMetrics).toBeDefined();
    expect(Array.isArray(result.teamMetrics)).toBe(true);

    const teamMetric = result.teamMetrics.find((m) => m.teamId === 'team-001');
    expect(teamMetric).toBeDefined();

    const fy2024ResolutionDays = fy2024Dataset.map((r) => r.resolutionDaysElapsed);
    const fy2024Average =
      fy2024ResolutionDays.reduce((sum, days) => sum + days, 0) / fy2024ResolutionDays.length;

    const fy2025ResolutionDays = fy2025Dataset.map((r) => r.resolutionDaysElapsed);
    const fy2025Average =
      fy2025ResolutionDays.reduce((sum, days) => sum + days, 0) / fy2025ResolutionDays.length;

    const expectedCombinedAverage = (fy2024Average + fy2025Average) / 2;

    expect(teamMetric!.issueResolutionSpeed).toBeCloseTo(expectedCombinedAverage, 1);

    expect(result.aggregationPeriod.startDate).toEqual(aggregationStartDate);
    expect(result.aggregationPeriod.endDate).toEqual(aggregationEndDate);
    expect(result.aggregationPeriod.dayCount).toBe(62);

    expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);
  });
});