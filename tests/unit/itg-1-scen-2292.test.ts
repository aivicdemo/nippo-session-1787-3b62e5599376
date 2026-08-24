import { describe, test, expect } from '@jest/globals';
import { calculateTeamPerformanceMetrics } from '../../src/logic/monthly-performance-analysis';

describe('生産性指標計算機能', () => {
  // SCEN-2292
  test('プロジェクトマネージャー権限がないユーザーが実行したとき、権限エラーが発生する', () => {
    const aggregationStartDate = new Date('2024-01-01');
    const aggregationEndDate = new Date('2024-01-31');
    const teamId = 'team-001';
    const userId = 'user-without-pm-role';
    const userRole = 'engineer';

    const reportRecords = [
      {
        reportId: 'report-001',
        reportDate: new Date('2024-01-15'),
        teamId: 'team-001',
        userId: 'engineer-001',
        yesterdayAccomplishments: 'Feature A development completed',
        todayPlans: 'Start Feature B',
        issues: 'Database connection timeout',
        submissionTime: new Date('2024-01-15T08:30:00Z'),
      },
    ];

    expect(() =>
      calculateTeamPerformanceMetrics(
        {
          aggregationStartDate,
          aggregationEndDate,
          teamId,
          reportRecords,
        },
        {
          userId,
          userRole,
        }
      )
    ).toThrow(/権限/);
  });
});