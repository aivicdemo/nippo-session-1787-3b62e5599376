import { refreshDashboardDisplay } from '../../src/logic/real-time-dashboard-update';

describe('RefreshDashboardDisplay', () => {
  // SCEN-177: [normal] 部長がダッシュボードを開いたときに現在の提出状況と課題データを集計・整形して画面表示用に準備する
  test('refreshDashboardDisplay processes valid manager dashboard request with correct aggregation and filtering', () => {
    const stubJudgeAccessPermission = jest.fn().mockReturnValue({
      isAuthorized: true,
      allowedDashboardTypes: ['team_overview', 'analytics'],
      dataVisibilityScope: 'all_team',
    });

    const stubAggregateCurrentSubmissionStatus = jest.fn().mockReturnValue({
      submittedCount: 8,
      unsubmittedCount: 2,
      submissionRate: 80,
      submissionDeadlineTime: '09:00',
    });

    const stubBuildUnsubmittedMembersDisplayList = jest.fn().mockReturnValue({
      totalUnsubmittedCount: 2,
      members: [
        {
          userId: 'user_A',
          displayName: 'メンバーA',
          teamName: '営業部',
          remainingMinutes: 45,
          urgencyLevel: 'critical',
          displayColor: '#FF5252',
        },
        {
          userId: 'user_B',
          displayName: 'メンバーB',
          teamName: '企画部',
          remainingMinutes: 45,
          urgencyLevel: 'critical',
          displayColor: '#FF5252',
        },
      ],
      displayTimestamp: new Date('2026-08-19T08:15:00Z').toISOString(),
    });

    const stubStructurePrioritizedIssueListForDisplay = jest.fn().mockReturnValue({
      displayIssues: [
        {
          issueId: 'issue_1',
          issueContent: '品質管理改善',
          priorityScore: 95,
          impactDegree: 87,
          colorCode: '#FF0000',
          displayRank: 1,
          extractedKeyword: '品質',
        },
        {
          issueId: 'issue_2',
          issueContent: '納期短縮対応',
          priorityScore: 72,
          impactDegree: 61,
          colorCode: '#FFAA00',
          displayRank: 2,
          extractedKeyword: '納期',
        },
      ],
      generatedAt: new Date('2026-08-19T08:15:00Z').toISOString(),
    });

    const stubEnrichDashboardWithLatestIssueData = jest.fn().mockReturnValue({
      issueKeywordRanking: [
        { keyword: '品質', frequency: 5, rank: 1 },
        { keyword: '納期', frequency: 3, rank: 2 },
      ],
      enrichedIssues: [
        {
          issueId: 'issue_1',
          issueContent: '品質管理改善',
          priorityScore: 95,
          impactDegree: 87,
          colorCode: '#FF0000',
          displayRank: 1,
          extractedKeyword: '品質',
        },
        {
          issueId: 'issue_2',
          issueContent: '納期短縮対応',
          priorityScore: 72,
          impactDegree: 61,
          colorCode: '#FFAA00',
          displayRank: 2,
          extractedKeyword: '納期',
        },
      ],
    });

    const stubApplyRoleBasedDashboardFiltering = jest.fn().mockReturnValue({
      visibleIssues: [
        {
          issueId: 'issue_1',
          issueContent: '品質管理改善',
          priorityScore: 95,
          impactDegree: 87,
          colorCode: '#FF0000',
          displayRank: 1,
          extractedKeyword: '品質',
        },
      ],
      visibleSubmissionStatus: {
        submittedCount: 8,
        unsubmittedCount: 2,
        submissionRate: 80,
        submissionDeadlineTime: '09:00',
      },
      visibleUnsubmittedMembers: [
        {
          userId: 'user_A',
          displayName: 'メンバーA',
          teamName: '営業部',
          remainingMinutes: 45,
          urgencyLevel: 'critical',
          displayColor: '#FF5252',
        },
        {
          userId: 'user_B',
          displayName: 'メンバーB',
          teamName: '企画部',
          remainingMinutes: 45,
          urgencyLevel: 'critical',
          displayColor: '#FF5252',
        },
      ],
      enabledFeatures: {
        canSendReminder: true,
        canViewDetails: true,
        canExport: true,
      },
    });

    const mockDeps = {
      judgeAccessPermission: stubJudgeAccessPermission,
      aggregateCurrentSubmissionStatus: stubAggregateCurrentSubmissionStatus,
      buildUnsubmittedMembersDisplayList: stubBuildUnsubmittedMembersDisplayList,
      structurePrioritizedIssueListForDisplay: stubStructurePrioritizedIssueListForDisplay,
      enrichDashboardWithLatestIssueData: stubEnrichDashboardWithLatestIssueData,
      applyRoleBasedDashboardFiltering: stubApplyRoleBasedDashboardFiltering,
    };

    const userId = 'manager_user_001';
    const teamId = 'team_A';
    const reportDate = '2026-08-19';
    const filterConditions = {
      keywordFilter: ['品質'],
      priorityRankFilter: ['high'],
      statusFilter: ['open'],
    };

    const result = refreshDashboardDisplay(
      userId,
      teamId,
      reportDate,
      filterConditions,
      mockDeps
    );

    expect(result).toBeDefined();
    expect(result.submissionStatusSummary).toBeDefined();
    expect(result.submissionStatusSummary.submittedCount).toBe(8);
    expect(result.submissionStatusSummary.unsubmittedCount).toBe(2);
    expect(result.submissionStatusSummary.submissionRate).toBe(80);
    expect(result.submissionStatusSummary.submissionDeadlineTime).toBe('09:00');

    expect(result.unsubmittedMembers).toBeDefined();
    expect(result.unsubmittedMembers.length).toBe(2);
    expect(result.unsubmittedMembers[0]).toEqual({
      userId: 'user_A',
      displayName: 'メンバーA',
      teamName: '営業部',
      remainingMinutes: 45,
      urgencyLevel: 'critical',
      displayColor: '#FF5252',
    });
    expect(result.unsubmittedMembers[1]).toEqual({
      userId: 'user_B',
      displayName: 'メンバーB',
      teamName: '企画部',
      remainingMinutes: 45,
      urgencyLevel: 'critical',
      displayColor: '#FF5252',
    });

    expect(result.prioritizedIssueList).toBeDefined();
    expect(result.prioritizedIssueList.length).toBe(2);
    expect(result.prioritizedIssueList[0].priorityScore).toBe(95);
    expect(result.prioritizedIssueList[0].impactDegree).toBe(87);
    expect(result.prioritizedIssueList[0].colorCode).toBe('#FF0000');
    expect(result.prioritizedIssueList[0].displayRank).toBe(1);
    expect(result.prioritizedIssueList[1].priorityScore).toBe(72);
    expect(result.prioritizedIssueList[1].impactDegree).toBe(61);
    expect(result.prioritizedIssueList[1].colorCode).toBe('#FFAA00');
    expect(result.prioritizedIssueList[1].displayRank).toBe(2);

    expect(result.issueKeywordRanking).toBeDefined();
    expect(result.issueKeywordRanking.length).toBe(2);
    expect(result.issueKeywordRanking[0].keyword).toBe('品質');
    expect(result.issueKeywordRanking[0].frequency).toBe(5);
    expect(result.issueKeywordRanking[0].rank).toBe(1);
    expect(result.issueKeywordRanking[1].keyword).toBe('納期');
    expect(result.issueKeywordRanking[1].frequency).toBe(3);
    expect(result.issueKeywordRanking[1].rank).toBe(2);

    expect(result.lastUpdatedAt).toBeInstanceOf(Date);

    expect(stubJudgeAccessPermission).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: userId,
        userRole: expect.any(String),
        requestedAction: 'view_dashboard',
        targetResourceType: 'dashboard',
      })
    );

    expect(stubAggregateCurrentSubmissionStatus).toHaveBeenCalledWith(
      expect.objectContaining({
        reportDate: reportDate,
        teamId: teamId,
      })
    );

    expect(stubBuildUnsubmittedMembersDisplayList).toHaveBeenCalled();

    expect(stubStructurePrioritizedIssueListForDisplay).toHaveBeenCalled();

    expect(stubEnrichDashboardWithLatestIssueData).toHaveBeenCalled();

    expect(stubApplyRoleBasedDashboardFiltering).toHaveBeenCalledWith(
      expect.objectContaining({
        filterConditions: filterConditions,
      })
    );
  });
});