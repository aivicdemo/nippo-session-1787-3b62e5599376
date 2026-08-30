import { prepareDashboardData } from '../../src/logic/dashboard-presentation';

describe('朝会報告管理システム', () => {
  // SCEN-386: [edge] 部長向けダッシュボード表示用に、提出状況サマリー、未提出メンバー一覧、優先度別課題一覧、課題キーワード発生頻度ランキングを集計・整形して返す。 - ダッシュボード更新時刻がデータベースに記録されていない場合という明示された境界条件でダッシュボードデータの更新履歴がありません。初回更新を実行します
  test('ダッシュボード更新時刻がnullの場合、初回更新を実行して全データを集計・返却する', async () => {
    const teamId = 'TEAM-001';
    const targetDate = new Date('2024-01-15T00:00:00Z');
    const requestingUserId = 'USER-MANAGER-001';
    const includeHistoricalTrend = false;

    const mockSubmissionStatusSummary = {
      submittedCount: 8,
      pendingCount: 2,
      submissionRate: 80,
      deadline: new Date('2024-01-15T09:00:00Z'),
    };

    const mockUnsubmittedMembers = [
      { memberId: 'USER-ENG-009', memberName: '太郎' },
      { memberId: 'USER-ENG-010', memberName: '花子' },
    ];

    const mockPrioritizedIssues = [
      {
        issueId: 'ISSUE-001',
        issueContent: 'ビルドエラー',
        priorityScore: 85,
        colorCode: '#FF0000',
        priorityRank: 'high' as const,
        impactLevel: '高',
        reporterName: 'エンジニアA',
      },
      {
        issueId: 'ISSUE-002',
        issueContent: 'テスト失敗',
        priorityScore: 70,
        colorCode: '#FFFF00',
        priorityRank: 'medium' as const,
        impactLevel: '中',
        reporterName: 'エンジニアB',
      },
      {
        issueId: 'ISSUE-003',
        issueContent: 'ドキュメント不足',
        priorityScore: 55,
        colorCode: '#00FF00',
        priorityRank: 'low' as const,
        impactLevel: '低',
        reporterName: 'エンジニアC',
      },
    ];

    const mockIssueKeywordRanking = [
      {
        keyword: 'ビルド',
        frequency: 5,
        averageImpactScore: 85,
        colorCode: '#FF0000',
        percentageOfTotal: 45,
      },
      {
        keyword: 'テスト',
        frequency: 4,
        averageImpactScore: 70,
        colorCode: '#FFFF00',
        percentageOfTotal: 36,
      },
      {
        keyword: 'ドキュメント',
        frequency: 2,
        averageImpactScore: 55,
        colorCode: '#00FF00',
        percentageOfTotal: 18,
      },
    ];

    const mockAccessTimestamp = new Date('2024-01-15T09:30:00Z');
    const mockLastReportSubmissionTime = new Date('2024-01-15T08:45:00Z');
    const mockLastDashboardRefreshTime = null;
    const refreshThresholdSeconds = 60;

    const mockAggregateSubmissionStatus = jest
      .fn()
      .mockResolvedValue(mockSubmissionStatusSummary);
    const mockBuildUnsubmittedList = jest
      .fn()
      .mockResolvedValue(mockUnsubmittedMembers);
    const mockFormatIssueListWithColor = jest
      .fn()
      .mockResolvedValue(mockPrioritizedIssues);
    const mockExtractKeywordRanking = jest
      .fn()
      .mockResolvedValue(mockIssueKeywordRanking);
    const mockEnsureDashboardFreshness = jest.fn().mockResolvedValue({
      isFresh: true,
      refreshExecuted: true,
      currentDataTimestamp: mockAccessTimestamp,
      staleDurationSeconds: 0,
    });

    const result = await prepareDashboardData(
      {
        teamId,
        targetDate,
        requestingUserId,
        includeHistoricalTrend,
      },
      {
        aggregateSubmissionStatus: mockAggregateSubmissionStatus,
        buildUnsubmittedMembersList: mockBuildUnsubmittedList,
        formatIssueListWithColorCoding: mockFormatIssueListWithColor,
        extractKeywordRanking: mockExtractKeywordRanking,
        ensureDashboardDataFreshness: mockEnsureDashboardFreshness,
      }
    );

    expect(result.submissionStatusSummary).toEqual(mockSubmissionStatusSummary);
    expect(result.unsubmittedMembers).toEqual(mockUnsubmittedMembers);
    expect(result.unsubmittedMembers.length).toBe(2);
    expect(result.prioritizedIssueList).toEqual(mockPrioritizedIssues);
    expect(result.prioritizedIssueList.length).toBe(3);
    expect(result.prioritizedIssueList[0].priorityScore).toBe(85);
    expect(result.prioritizedIssueList[1].priorityScore).toBe(70);
    expect(result.prioritizedIssueList[2].priorityScore).toBe(55);
    expect(result.issueKeywordRanking).toEqual(mockIssueKeywordRanking);
    expect(result.issueKeywordRanking.length).toBe(3);
    expect(result.lastUpdatedAt).toEqual(mockAccessTimestamp);
    expect(result.lastUpdatedAt.getTime()).toBeGreaterThanOrEqual(
      new Date('2024-01-15T09:30:00Z').getTime() - 1000
    );
    expect(result.lastUpdatedAt.getTime()).toBeLessThanOrEqual(
      new Date('2024-01-15T09:30:00Z').getTime() + 1000
    );
    expect(mockEnsureDashboardFreshness).toHaveBeenCalledWith(
      expect.objectContaining({
        accessTimestamp: expect.any(Date),
        lastReportSubmissionTime: expect.any(Date),
        lastDashboardRefreshTime: null,
        refreshThresholdSeconds,
      })
    );
  });
});