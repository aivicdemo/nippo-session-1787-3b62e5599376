import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { ensureDashboardDataFreshness } from '../../src/logic/manager-dashboard';
import type { DashboardDataFreshnessInput, DashboardDataFreshnessOutput } from '../../src/logic/manager-dashboard';

describe('課題の優先度を色分けで表示するダッシュボード機能', () => {
  // SCEN-1050
  test('優先度スコアが null のとき、更新処理がエラーになる', () => {
    const input: DashboardDataFreshnessInput = {
      userId: 'user-001',
      teamId: 'team-001',
      reportDate: '2024-01-15',
      maxStalenessSeconds: 300,
    };

    const mockDashboardData = {
      reportDate: '2024-01-15',
      submissionSummary: {
        totalMembers: 10,
        submittedCount: 10,
        unsubmittedCount: 0,
        submissionRate: 100,
      },
      prioritizedIssues: [
        {
          issueId: 'issue-001',
          issueContent: 'テスト課題',
          priorityScore: null,
          priorityColor: 'red',
          impactLevel: 'high',
          reporterName: 'エンジニアA',
        },
      ],
      unsubmittedMembers: [],
      lastUpdatedAt: '2024-01-15T10:00:00Z',
    };

    expect(() => {
      ensureDashboardDataFreshness(input, mockDashboardData as any);
    }).toThrow(/優先度スコア|priorityScore/);
  });
});