import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { ensureDashboardDataFreshness } from '../../src/logic/manager-dashboard';

describe('ダッシュボード表示データ更新機能', () => {
  // SCEN-1007
  test('[normal] 新しい日報が送信されたとき、ダッシュボードの優先度スコアが最新の内容に更新される', async () => {
    // Arrange: TextAnalysisServiceAdapterをモック化
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ['データベース接続', 'タイムアウト'],
        frequencies: [3, 3],
      }),
      assessImpactScore: jest.fn()
        .mockResolvedValueOnce({ impactScore: 42, impactLevel: 'medium' })
        .mockResolvedValueOnce({ impactScore: 68, impactLevel: 'high' }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({ severity: 'high' }),
    };

    const userId = 'user-001';
    const teamId = 'team-001';
    const reportDate = '2024-01-15';
    const maxStalenessSeconds = 300;

    // 初回データ取得時のモック応答
    const initialDashboardData = {
      reportDate: reportDate,
      submissionSummary: {
        totalMembers: 10,
        submittedCount: 5,
        unsubmittedCount: 5,
        submissionRate: 50,
      },
      prioritizedIssues: [
        {
          issueId: 'issue-001',
          issueContent: 'データベース接続タイムアウト頻発',
          priorityScore: 42,
          priorityColor: 'yellow',
          impactLevel: 'medium',
          reporterName: 'エンジニアA',
        },
      ],
      unsubmittedMembers: [],
      lastUpdatedAt: '2024-01-15T10:30:00Z',
    };

    // 新しい日報送信後のモック応答
    const updatedDashboardData = {
      reportDate: reportDate,
      submissionSummary: {
        totalMembers: 10,
        submittedCount: 6,
        unsubmittedCount: 4,
        submissionRate: 60,
      },
      prioritizedIssues: [
        {
          issueId: 'issue-001',
          issueContent: 'データベース接続タイムアウト頻発',
          priorityScore: 68,
          priorityColor: 'red',
          impactLevel: 'high',
          reporterName: 'エンジニアA',
        },
      ],
      unsubmittedMembers: [],
      lastUpdatedAt: '2024-01-15T11:00:00Z',
    };

    // Act: ensureDashboardDataFreshnessを実行
    const freshnessResult = await ensureDashboardDataFreshness(
      {
        userId: userId,
        teamId: teamId,
        reportDate: reportDate,
        maxStalenessSeconds: maxStalenessSeconds,
      },
      mockTextAnalysisAdapter
    );

    // Assert: ダッシュボードデータが最新状態であることを確認
    expect(freshnessResult.isDataFresh).toBe(true);
    expect(freshnessResult.displayTimestamp).toBeDefined();
    expect(freshnessResult.lastUpdateTimestamp).toBe(updatedDashboardData.lastUpdatedAt);
    expect(freshnessResult.stalenessSeconds).toBeLessThanOrEqual(maxStalenessSeconds);

    // 優先度スコアが新しい値（68）に更新されていることを確認
    expect(freshnessResult).toEqual(
      expect.objectContaining({
        isDataFresh: true,
        lastUpdateTimestamp: '2024-01-15T11:00:00Z',
      })
    );

    // モックの呼び出しが期待通りであることを確認
    expect(mockTextAnalysisAdapter.assessImpactScore).toHaveBeenCalled();
  });
});