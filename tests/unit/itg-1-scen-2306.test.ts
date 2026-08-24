import { describe, test, expect } from '@jest/globals';
import { calculateTeamPerformanceMetrics } from '../../src/logic/monthly-performance-analysis';
import type { TeamPerformanceMetricsInput, TeamPerformanceMetricsOutput } from '../../src/logic/monthly-performance-analysis';

describe('Team Performance Metrics - Issue Resolution Speed Calculation', () => {
  // SCEN-2306: [edge] 課題解決速度計算機能 - 課題が報告された日と解決した日が同日の場合、解決速度が 0 日と算出される
  test('should calculate resolution speed as 0 days when issue is reported and resolved on the same day', () => {
    const aggregationStartDate = new Date('2026-08-19T00:00:00Z');
    const aggregationEndDate = new Date('2026-08-19T23:59:59Z');
    const teamIds = ['team-001'];

    const reportRecords = [
      {
        reportId: 'report-001',
        reportedDate: new Date('2026-08-19T09:00:00Z'),
        teamId: 'team-001',
        memberId: 'member-001',
        yesterdayAccomplishment: 'Feature A implementation',
        todayPlan: 'Testing Feature A',
        issuesReported: [
          {
            issueId: 'issue-001',
            issueName: 'Bug in Feature A',
            reportedDate: new Date('2026-08-19T09:00:00Z'),
            resolvedDate: new Date('2026-08-19T17:00:00Z'),
            resolutionStatus: 'resolved' as const,
          },
        ],
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
    expect(result.teamMetrics.length).toBe(1);

    const teamMetric = result.teamMetrics[0];
    expect(teamMetric.teamId).toBe('team-001');
    expect(teamMetric.issueResolutionSpeed).toBe(0);
  });
});