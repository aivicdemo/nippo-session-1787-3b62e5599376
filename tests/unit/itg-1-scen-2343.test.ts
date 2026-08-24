import { describe, test, expect } from '@jest/globals';
import { calculateTeamPerformanceMetrics } from '../../src/logic/monthly-performance-analysis';
import type { TeamPerformanceMetricsInput, TeamPerformanceMetricsOutput } from '../../src/logic/monthly-performance-analysis';

describe('課題の影響度判定と優先度スコア表示機能', () => {
  // SCEN-2343: [edge] 課題解決速度計算機能 - 対応完了率が0%のとき、0と表示される
  test('対応完了率が0%の場合、課題解決速度は0として返される', () => {
    const aggregationStartDate = new Date('2024-01-01T00:00:00Z');
    const aggregationEndDate = new Date('2024-01-31T23:59:59Z');
    const teamIds = ['team-001'];

    const reportRecords = [
      {
        reportId: 'report-001',
        teamId: 'team-001',
        reportedDate: new Date('2024-01-15T09:00:00Z'),
        content: {
          yesterday: 'APIの修正作業',
          today: 'DB接続テスト',
          issues: 'パフォーマンス問題が未解決'
        },
        extractedIssues: [
          {
            issueId: 'issue-001',
            keyword: 'パフォーマンス問題',
            reportedDate: new Date('2024-01-15T09:00:00Z'),
            resolvedDate: null,
            status: 'open' as const,
            resolutionDays: null
          }
        ]
      }
    ];

    const input: TeamPerformanceMetricsInput = {
      aggregationStartDate,
      aggregationEndDate,
      teamIds,
      reportDataset: reportRecords
    };

    const result: TeamPerformanceMetricsOutput = calculateTeamPerformanceMetrics(input);

    expect(result).toBeDefined();
    expect(result.teamMetrics).toBeDefined();
    expect(Array.isArray(result.teamMetrics)).toBe(true);

    const teamMetric = result.teamMetrics.find(metric => metric.teamId === 'team-001');
    expect(teamMetric).toBeDefined();
    expect(teamMetric!.issueResolutionSpeed).toBe(0);
    expect(typeof teamMetric!.issueResolutionSpeed).toBe('number');
  });
});