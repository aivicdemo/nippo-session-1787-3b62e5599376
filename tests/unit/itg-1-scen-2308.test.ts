import { describe, test, expect } from '@jest/globals';
import { calculateTeamPerformanceMetrics } from '../../src/logic/monthly-performance-analysis';
import type { TeamPerformanceMetricsInput, TeamPerformanceMetricsOutput } from '../../src/logic/monthly-performance-analysis';

describe('calculateTeamPerformanceMetrics', () => {
  // SCEN-2308: メンバー別生産性スコア計算機能 - 出勤率が100%として算出される場合
  test('should calculate member submission rate as 100% when reporting on all days within aggregation period', () => {
    const aggregationStartDate = new Date('2024-01-08');
    const aggregationEndDate = new Date('2024-01-14');
    const teamIds = ['team-001'];

    const reportRecords = [
      {
        reportId: 'report-001',
        teamId: 'team-001',
        reportDate: new Date('2024-01-08'),
        memberId: 'memberA',
        yesterdayAccomplishment: 'Task 1 completed',
        todayPlan: 'Task 2 planned',
        issues: 'Issue 1',
        submissionTimestamp: new Date('2024-01-08T08:30:00Z'),
      },
      {
        reportId: 'report-002',
        teamId: 'team-001',
        reportDate: new Date('2024-01-09'),
        memberId: 'memberA',
        yesterdayAccomplishment: 'Task 2 completed',
        todayPlan: 'Task 3 planned',
        issues: 'Issue 2',
        submissionTimestamp: new Date('2024-01-09T08:30:00Z'),
      },
      {
        reportId: 'report-003',
        teamId: 'team-001',
        reportDate: new Date('2024-01-10'),
        memberId: 'memberA',
        yesterdayAccomplishment: 'Task 3 completed',
        todayPlan: 'Task 4 planned',
        issues: 'Issue 3',
        submissionTimestamp: new Date('2024-01-10T08:30:00Z'),
      },
      {
        reportId: 'report-004',
        teamId: 'team-001',
        reportDate: new Date('2024-01-11'),
        memberId: 'memberA',
        yesterdayAccomplishment: 'Task 4 completed',
        todayPlan: 'Task 5 planned',
        issues: 'Issue 4',
        submissionTimestamp: new Date('2024-01-11T08:30:00Z'),
      },
      {
        reportId: 'report-005',
        teamId: 'team-001',
        reportDate: new Date('2024-01-12'),
        memberId: 'memberA',
        yesterdayAccomplishment: 'Task 5 completed',
        todayPlan: 'Task 6 planned',
        issues: 'Issue 5',
        submissionTimestamp: new Date('2024-01-12T08:30:00Z'),
      },
      {
        reportId: 'report-006',
        teamId: 'team-001',
        reportDate: new Date('2024-01-13'),
        memberId: 'memberA',
        yesterdayAccomplishment: 'Task 6 completed',
        todayPlan: 'Task 7 planned',
        issues: 'Issue 6',
        submissionTimestamp: new Date('2024-01-13T08:30:00Z'),
      },
      {
        reportId: 'report-007',
        teamId: 'team-001',
        reportDate: new Date('2024-01-14'),
        memberId: 'memberA',
        yesterdayAccomplishment: 'Task 7 completed',
        todayPlan: 'Task 8 planned',
        issues: 'Issue 7',
        submissionTimestamp: new Date('2024-01-14T08:30:00Z'),
      },
    ];

    const input: TeamPerformanceMetricsInput = {
      aggregationStartDate,
      aggregationEndDate,
      teamIds,
      reportDataset: reportRecords,
    };

    const result: TeamPerformanceMetricsOutput = calculateTeamPerformanceMetrics(input);

    expect(result).toBeDefined();
    expect(result.teamMetrics).toBeDefined();
    expect(Array.isArray(result.teamMetrics)).toBe(true);
    expect(result.teamMetrics.length).toBeGreaterThan(0);

    const teamMetric = result.teamMetrics.find((metric) => metric.teamId === 'team-001');
    expect(teamMetric).toBeDefined();

    const memberProductivityScores = result.memberProductivityScores || [];
    const memberAScore = memberProductivityScores.find((score) => score.memberId === 'memberA');

    expect(memberAScore).toBeDefined();
    expect(memberAScore?.submissionRate).toBe(100.0);
  });
});