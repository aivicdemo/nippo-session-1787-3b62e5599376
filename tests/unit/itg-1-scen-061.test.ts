import { prepareDashboardData, type DashboardDisplayData } from '../../src/logic/dashboard-presentation';

describe('朝会報告管理システム', () => {
  test('SCEN-061: [normal] 部長向けダッシュボード表示用に、提出状況サマリー、未提出メンバー一覧、優先度別課題一覧、課題キーワード発生頻度ランキングを集計・整形して返す', () => {
    // スタブモック: aggregateSubmissionStatusSummary
    const mockSubmissionStatusSummary = {
      submittedCount: 7,
      unsubmittedCount: 3,
      submissionDeadline: '09:00'
    };

    // スタブモック: buildUnsubmittedMembersList
    const mockUnsubmittedMembers = [
      {
        memberId: 'user-eng-001',
        memberName: '佐藤太郎',
        department: '開発チーム A',
        colorCode: '#FF0000'
      },
      {
        memberId: 'user-eng-002',
        memberName: '鈴木花子',
        department: '開発チーム A',
        colorCode: '#FF0000'
      },
      {
        memberId: 'user-eng-003',
        memberName: '田中次郎',
        department: '開発チーム B',
        colorCode: '#FF0000'
      }
    ];

    // スタブモック: formatIssueListWithColorCoding
    const mockPrioritizedIssues = [
      {
        issueId: 'issue-001',
        issueContent: 'ビルド失敗が連続発生',
        priorityScore: 92,
        colorCode: '#FF0000',
        impactLevel: '高'
      },
      {
        issueId: 'issue-002',
        issueContent: 'テスト環境の不安定性',
        priorityScore: 78,
        colorCode: '#FF9900',
        impactLevel: '高'
      },
      {
        issueId: 'issue-003',
        issueContent: 'デプロイ待ち時間増加',
        priorityScore: 65,
        colorCode: '#FFFF00',
        impactLevel: '中'
      },
      {
        issueId: 'issue-004',
        issueContent: 'レビュー指摘の軽微なバグ',
        priorityScore: 45,
        colorCode: '#FFFF00',
        impactLevel: '中'
      },
      {
        issueId: 'issue-005',
        issueContent: 'ドキュメント更新の遅延',
        priorityScore: 32,
        colorCode: '#00CC00',
        impactLevel: '低'
      }
    ];

    // スタブモック: getIssueKeywordRanking
    const mockIssueKeywordRanking = [
      {
        keyword: 'ビルド',
        frequency: 8,
        percentageOfTotal: 32.0
      },
      {
        keyword: 'テスト',
        frequency: 6,
        percentageOfTotal: 24.0
      },
      {
        keyword: 'デプロイ',
        frequency: 5,
        percentageOfTotal: 20.0
      },
      {
        keyword: 'リソース',
        frequency: 3,
        percentageOfTotal: 12.0
      },
      {
        keyword: 'ドキュメント',
        frequency: 3,
        percentageOfTotal: 12.0
      }
    ];

    // モック関数を定義
    const mockAggregateSubmissionStatusSummary = jest.fn().mockReturnValue(mockSubmissionStatusSummary);
    const mockBuildUnsubmittedMembersList = jest.fn().mockReturnValue(mockUnsubmittedMembers);
    const mockFormatIssueListWithColorCoding = jest.fn().mockReturnValue(mockPrioritizedIssues);
    const mockGetIssueKeywordRanking = jest.fn().mockReturnValue(mockIssueKeywordRanking);

    // prepareDashboardData を呼び出し時の日時を固定
    const mockTargetDate = new Date('2024-01-15T09:30:00Z');
    const mockRequestingUserId = 'user-dept-head-001';
    const mockTeamId = 'team-001';

    // prepareDashboardData を実行
    const result: DashboardDisplayData = prepareDashboardData(
      {
        teamId: mockTeamId,
        targetDate: mockTargetDate,
        requestingUserId: mockRequestingUserId,
        includeHistoricalTrend: false
      },
      {
        aggregateSubmissionStatusSummary: mockAggregateSubmissionStatusSummary,
        buildUnsubmittedMembersList: mockBuildUnsubmittedMembersList,
        formatIssueListWithColorCoding: mockFormatIssueListWithColorCoding,
        getIssueKeywordRanking: mockGetIssueKeywordRanking
      }
    );

    // 提出状況サマリーの検証
    expect(result.submissionStatusSummary.submittedCount).toBe(7);
    expect(result.submissionStatusSummary.unsubmittedCount).toBe(3);
    expect(result.submissionStatusSummary.submissionDeadline).toBe('09:00');

    // 未提出メンバー一覧の検証
    expect(result.unsubmittedMembers).toHaveLength(3);
    expect(result.unsubmittedMembers[0]).toEqual({
      memberId: 'user-eng-001',
      memberName: '佐藤太郎',
      department: '開発チーム A',
      colorCode: '#FF0000'
    });
    expect(result.unsubmittedMembers[1]).toEqual({
      memberId: 'user-eng-002',
      memberName: '鈴木花子',
      department: '開発チーム A',
      colorCode: '#FF0000'
    });
    expect(result.unsubmittedMembers[2]).toEqual({
      memberId: 'user-eng-003',
      memberName: '田中次郎',
      department: '開発チーム B',
      colorCode: '#FF0000'
    });

    // 優先度別課題一覧の検証
    expect(result.prioritizedIssueList).toHaveLength(5);
    expect(result.prioritizedIssueList[0]).toEqual({
      issueId: 'issue-001',
      issueContent: 'ビルド失敗が連続発生',
      priorityScore: 92,
      colorCode: '#FF0000',
      impactLevel: '高'
    });
    expect(result.prioritizedIssueList[1]).toEqual({
      issueId: 'issue-002',
      issueContent: 'テスト環境の不安定性',
      priorityScore: 78,
      colorCode: '#FF9900',
      impactLevel: '高'
    });
    expect(result.prioritizedIssueList[2]).toEqual({
      issueId: 'issue-003',
      issueContent: 'デプロイ待ち時間増加',
      priorityScore: 65,
      colorCode: '#FFFF00',
      impactLevel: '中'
    });
    expect(result.prioritizedIssueList[3]).toEqual({
      issueId: 'issue-004',
      issueContent: 'レビュー指摘の軽微なバグ',
      priorityScore: 45,
      colorCode: '#FFFF00',
      impactLevel: '中'
    });
    expect(result.prioritizedIssueList[4]).toEqual({
      issueId: 'issue-005',
      issueContent: 'ドキュメント更新の遅延',
      priorityScore: 32,
      colorCode: '#00CC00',
      impactLevel: '低'
    });

    // 課題キーワード発生頻度ランキングの検証
    expect(result.issueKeywordRanking).toHaveLength(5);
    expect(result.issueKeywordRanking[0]).toEqual({
      keyword: 'ビルド',
      frequency: 8,
      percentageOfTotal: 32.0
    });
    expect(result.issueKeywordRanking[1]).toEqual({
      keyword: 'テスト',
      frequency: 6,
      percentageOfTotal: 24.0
    });
    expect(result.issueKeywordRanking[2]).toEqual({
      keyword: 'デプロイ',
      frequency: 5,
      percentageOfTotal: 20.0
    });
    expect(result.issueKeywordRanking[3]).toEqual({
      keyword: 'リソース',
      frequency: 3,
      percentageOfTotal: 12.0
    });
    expect(result.issueKeywordRanking[4]).toEqual({
      keyword: 'ドキュメント',
      frequency: 3,
      percentageOfTotal: 12.0
    });

    // 最終更新時刻の検証（Date 型であることと、実行時刻の直後であることを確認）
    expect(result.lastUpdatedAt).toBeInstanceOf(Date);
    expect(result.lastUpdatedAt.getTime()).toBeGreaterThanOrEqual(mockTargetDate.getTime());
  });
});