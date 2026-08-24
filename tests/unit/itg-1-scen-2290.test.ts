import { describe, test, expect } from '@jest/globals';
import { calculateTeamPerformanceMetrics } from '../../src/logic/monthly-performance-analysis';
import type { TeamPerformanceMetricsInput, TeamPerformanceMetricsOutput } from '../../src/logic/monthly-performance-analysis';

describe('生産性指標計算機能', () => {
  // SCEN-2290
  test('[error] メンバー別生産性スコアが計算対象のメンバーデータを持たないとき、エラーが発生する', () => {
    const aggregationStartDate = new Date('2024-01-01T00:00:00Z');
    const aggregationEndDate = new Date('2024-01-31T23:59:59Z');
    const teamIds = ['team_001'];
    const reportRecords = [
      {
        reportId: 'report_001',
        memberId: 'member_001',
        teamId: 'team_001',
        reportedDate: new Date('2024-01-15T09:00:00Z'),
        yesterdayWork: 'データベース設計ドキュメント作成',
        todayPlan: 'スキーマ実装開始',
        issues: 'インデックス設計に疑問点あり',
        submissionStatus: 'submitted' as const,
        submittedAt: new Date('2024-01-15T08:30:00Z'),
      },
    ];

    const input: TeamPerformanceMetricsInput = {
      aggregationStartDate,
      aggregationEndDate,
      teamIds,
      reportRecords,
      minimumReportThreshold: 10,
    };

    expect(() => {
      calculateTeamPerformanceMetrics(input);
    }).toThrow(/member_001|メンバー|MEMBER_NOT_FOUND/i);
  });
});