import { prepareDashboardData, type DashboardDataPrepareInput, type DashboardDisplayData } from '../../src/logic/dashboard-presentation';

describe('朝会報告管理システム - ダッシュボード表示機能', () => {
  test('SCEN-197: 部長向けダッシュボード表示用に提出状況サマリー、未提出メンバー一覧、優先度別課題一覧、課題キーワード発生頻度ランキングを集計・整形して返す', () => {
    // Arrange
    const currentTime = new Date('2024-01-15T08:00:00Z');
    const deadlineTime = new Date('2024-01-15T08:30:00Z');
    const teamId = 'TEAM001';
    const targetDate = new Date('2024-01-15');
    const requestingUserId = 'MANAGER001';

    // チームメンバー10名のID
    const teamMemberIds = [
      'M001', 'M002', 'M003', 'M004', 'M005',
      'M006', 'M007', 'M008', 'M009', 'M010'
    ];

    // 8名が提出済み、2名が未提出
    const reportSubmissions = [
      {
        memberId: 'M001',
        submittedAt: new Date('2024-01-15T07:50:00Z'),
        yesterday: 'タスクA完了',
        today: 'タスクB進行',
        issues: 'バグ発生'
      },
      {
        memberId: 'M002',
        submittedAt: new Date('2024-01-15T07:55:00Z'),
        yesterday: 'タスクC完了',
        today: 'タスクD進行',
        issues: '遅延リスク'
      },
      {
        memberId: 'M003',
        submittedAt: new Date('2024-01-15T07:48:00Z'),
        yesterday: 'タスクE完了',
        today: 'タスクF進行',
        issues: 'リソース不足'
      },
      {
        memberId: 'M004',
        submittedAt: new Date('2024-01-15T07:52:00Z'),
        yesterday: 'タスクG完了',
        today: 'タスクH進行',
        issues: 'バグ発生'
      },
      {
        memberId: 'M005',
        submittedAt: new Date('2024-01-15T07:45:00Z'),
        yesterday: 'タスクI完了',
        today: 'タスクJ進行',
        issues: '依存関係'
      },
      {
        memberId: 'M006',
        submittedAt: new Date('2024-01-15T07:58:00Z'),
        yesterday: 'タスクK完了',
        today: 'タスクL進行',
        issues: '遅延リスク'
      },
      {
        memberId: 'M007',
        submittedAt: new Date('2024-01-15T07:46:00Z'),
        yesterday: 'タスクM完了',
        today: 'タスクN進行',
        issues: 'リソース不足'
      },
      {
        memberId: 'M008',
        submittedAt: new Date('2024-01-15T07:51:00Z'),
        yesterday: 'タスクO完了',
        today: 'タスクP進行',
        issues: 'バグ発生'
      }
    ];

    const input: DashboardDataPrepareInput = {
      teamId: teamId,
      targetDate: targetDate,
      requestingUserId: requestingUserId,
      includeHistoricalTrend: false
    };

    // Act
    const result: DashboardDisplayData = prepareDashboardData(input);

    // Assert - submissionStatusSummary 検証
    expect(result.submissionStatusSummary.totalSubmitted).toBe(8);
    expect(result.submissionStatusSummary.totalPending).toBe(2);
    expect(result.submissionStatusSummary.submissionRate).toBe(80.0);

    // unsubmittedMembers 検証（M009, M010が含まれること）
    expect(result.unsubmittedMembers).toBeDefined();
    expect(result.unsubmittedMembers.length).toBeGreaterThanOrEqual(2);
    const unsubmittedIds = result.unsubmittedMembers.map(m => m.memberId);
    expect(unsubmittedIds).toContain('M009');
    expect(unsubmittedIds).toContain('M010');

    // prioritizedIssueList 検証
    expect(result.prioritizedIssueList).toBeDefined();
    expect(Array.isArray(result.prioritizedIssueList)).toBe(true);

    // issueKeywordRanking 検証
    expect(result.issueKeywordRanking).toBeDefined();
    expect(Array.isArray(result.issueKeywordRanking)).toBe(true);

    // lastUpdatedAt が日付オブジェクトであることを検証
    expect(result.lastUpdatedAt).toBeInstanceOf(Date);
    expect(result.lastUpdatedAt.getTime()).toBeGreaterThan(0);

    // 構造検証 - submissionStatusSummary の必須フィールド
    expect(result.submissionStatusSummary).toHaveProperty('totalSubmitted');
    expect(result.submissionStatusSummary).toHaveProperty('totalPending');
    expect(result.submissionStatusSummary).toHaveProperty('submissionRate');

    // 構造検証 - unsubmittedMembers の各要素
    result.unsubmittedMembers.forEach(member => {
      expect(member).toHaveProperty('memberId');
      expect(member).toHaveProperty('memberName');
      expect(typeof member.memberId).toBe('string');
      expect(typeof member.memberName).toBe('string');
    });

    // 構造検証 - prioritizedIssueList の各要素
    result.prioritizedIssueList.forEach(issue => {
      expect(issue).toHaveProperty('issueId');
      expect(issue).toHaveProperty('issueContent');
      expect(issue).toHaveProperty('priorityScore');
      expect(issue).toHaveProperty('colorCode');
      expect(issue).toHaveProperty('impactLevel');
      expect(issue).toHaveProperty('reporterName');
    });

    // 構造検証 - issueKeywordRanking の各要素
    result.issueKeywordRanking.forEach(ranking => {
      expect(ranking).toHaveProperty('keyword');
      expect(ranking).toHaveProperty('frequency');
      expect(ranking).toHaveProperty('percentageOfTotal');
    });
  });
});