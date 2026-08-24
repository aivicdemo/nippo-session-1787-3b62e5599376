import { calculateTeamPerformanceMetrics } from '../../src/logic/monthly-performance-analysis';
import { type TeamPerformanceMetricsInput, type TeamPerformanceMetricsOutput } from '../../src/logic/monthly-performance-analysis';

describe('朝会報告管理システム', () => {
  // SCEN-2291: [error] 生産性指標計算機能 - 課題解決速度を計算する際に課題ステータス遷移データが欠落しているとき、エラーが発生する
  test('should throw validation error when issue status transitions data is missing during productivity metrics calculation', () => {
    const aggregationStartDate = new Date('2024-01-01T00:00:00Z');
    const aggregationEndDate = new Date('2024-01-31T23:59:59Z');
    const teamIds = ['team-001'];

    const reportRecordsWithMissingStatusTransitions: TeamPerformanceMetricsInput['reportRecords'] = [
      {
        reportId: 'report-001',
        reportedDate: new Date('2024-01-15T09:00:00Z'),
        reportedByUserId: 'user-001',
        teamId: 'team-001',
        yesterdayAccomplishment: 'Completed feature A',
        todayPlan: 'Work on feature B',
        currentIssues: 'Delayed API response',
        issueStatusTransitions: undefined,
      },
      {
        reportId: 'report-002',
        reportedDate: new Date('2024-01-16T09:00:00Z'),
        reportedByUserId: 'user-002',
        teamId: 'team-001',
        yesterdayAccomplishment: 'Fixed bug in module X',
        todayPlan: 'Testing module Y',
        currentIssues: 'Resource shortage',
        issueStatusTransitions: null,
      },
    ];

    const input: TeamPerformanceMetricsInput = {
      aggregationStartDate,
      aggregationEndDate,
      teamIds,
      reportRecords: reportRecordsWithMissingStatusTransitions,
    };

    expect(() => calculateTeamPerformanceMetrics(input)).toThrow(/課題ステータス遷移/);
  });
});